define(['jquery', 'jquery-ui', 'jquery.tmpl'], function($, jqueryUi, tmpl) {

return function(config) {
    var w = config.writer;
    
    var parentId = config.parentId;
    
    var parent = $('#'+parentId);
    
    /**
     * datasource requires 2 properties: name (string), and tmpl (a string representing a jquery tmpl template)
     */
    var datasource = config.datasource;
    
    parent.append(''+
    '<div id="'+parentId+'_searchBox" style="height: 31px;">'+
        '<label for="'+parentId+'_search_query">Search</label>'+
        '<input type="text" name="query" id="'+parentId+'_search_query" />'+
    '</div>'+
    '<div style="height: '+(parent.height()-70)+'px;">'+
        '<div id="'+parentId+'_lookupServices">'+
            '<div id="'+parentId+'_lookup_project">'+
                '<h3>'+config.title+' from CWRC Collections</h3>'+
                '<div><div class="searchResultsParent"><ul class="searchResults"></ul></div></div>'+
            '</div>'+
            '<div id="'+parentId+'_lookup_'+datasource.name+'">'+
                '<h3>'+config.title+' from Web Sources</h3>'+
                '<div><div class="searchResultsParent"><ul class="searchResults"></ul></div></div>'+
            '</div>'+
        '</div>'+
    '</div>');
    
    var searchInput = $('#'+parentId+'_search_query')[0];
    $(searchInput).bind('keyup', function() {
        doQuery();
    });
    
    var accordionParent = $('#'+parentId+'_lookupServices');
    accordionParent.accordion({
        header: 'div > h3',
        heightStyle: 'fill',
        active: 1,
        activate: function(event, ui) {
            doQuery();
        }
    });
    
    var doQuery = function() {
        var activeContent = accordionParent.find('div.ui-accordion-content-active');
        var lookupService = activeContent.parent()[0].id.replace(parentId+'_lookup_', '');
        var type = config.type;
        
        activeContent.find('div.searchResultsParent').css({borderColor: '#fff'});
        
        activeContent.find('ul').first().html('<li class="unselectable last"><span>Searching...</span></li>');
        
        var query = searchInput.value;
        
        w.delegator.lookupEntity({type: type, query: query, lookupService: lookupService}, handleResults);
    };
    
    /**
     * @param results A jquery object containing a set of record elements
     */
    var handleResults = function(results) {
        var ul = accordionParent.find('div.ui-accordion-content-active div.searchResultsParent ul');
        
        var formattedResults = '';
        var last = '';
        
        if (results == null) {
            ul.first().html('<li class="unselectable last"><span>Server error.</span></li>');
        } else if (results.length == 0) {
            ul.first().html('<li class="unselectable last"><span>No results.</span></li>');
        } else {
            var active = accordionParent.accordion('option', 'active');
            if (active == 0) { // project
                var r, i, label;
                for (i = 0; i < results.length; i++) {
                    r = results[i];
                    
                    label = r.name || r.identifier || r.term || r[currentType];

                    if (i == results.length - 1) last = 'last';
                    else last = '';
                    
                    formattedResults += '<li class="unselectable '+last+'">';
                    formattedResults += '<span>'+label+'</span>';
                    formattedResults += '</li>';
                }
            } else if (active == 1) { // datasource
                var r, i;
                for (i = 0; i < results.length; i++) {
                    r = results[i];
                    
                    if (i == results.length - 1) last = 'last';
                    else last = '';
                    
                    formattedResults += '<li class="unselectable '+last+'">';
                    formattedResults += $.tmpl(datasource.tmpl, r)[0].outerHTML;
                    formattedResults += '</li>';
                }
            }
            
            ul.first().html(formattedResults);
            
            ul.find('li').each(function(index) {
                $(this).data(results[index]);
            }).click(function(event) {
                var clicked = $(this);
                var source = clicked.parents('#'+parentId+'_lookup_project').length == 0 ? datasource.name : 'cwrc';
                accordionParent.find('div.ui-accordion-content-active div.searchResultsParent').css({borderColor: '#fff'});
                var remove = clicked.hasClass('selected');
                accordionParent.find('div.ui-accordion-content-active ul li').removeClass('selected');
                if (!remove ) clicked.addClass('selected');
                if (config.clickHandler) {
                    config.clickHandler(clicked.data(), source, !remove);
                }
            });
        }
    };
    
    return {
        populateSearch: function(query) {
            searchInput.value = query;
            doQuery();
        },
        getSelected: function() {
            var data = accordionParent.find('div.ui-accordion-content-active ul li.selected').data();
            return data;
        },
        markInvalid: function() {
            accordionParent.find('div.ui-accordion-content-active div.searchResultsParent').css({borderColor: 'red'});
        }
    };
};

});