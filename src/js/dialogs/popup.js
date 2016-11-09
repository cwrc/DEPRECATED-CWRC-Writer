define(['jquery', 'jquery-ui', 'jquery.popup'], function($, jqueryUi, jPopup) {
    
return function(writer) {
    var w = writer;
    
    var popupSelector = '';
    var linkSelector = '';
    
    var popupId = w.getUniqueId('popupDialog');
    var $popupEl = $('<div id="'+popupId+'"></div>').appendTo(document.body);
    $popupEl.popup({
        autoOpen: false,
        resizable: false,
        draggable: false,
        minHeight: 30,
        minWidth: 40,
        open: function(event, ui) {
            $popupEl.parent().find('.ui-dialog-titlebar-close').hide();
        }
    });
    var popupCloseId;
    
    var $currentTag;
    var setCurrentTag = function(id) {
        $currentTag = $('#'+id, w.editor.getBody());
        if ($currentTag.length == 0) {
            $currentTag = $('[name="'+id+'"]', w.editor.getBody()).first();    
        }
    }
    
    var doPosition = function() {
        $popupEl.popup('option', 'position', {
            using: function(topLeft, posObj) {
                var $popupEl = posObj.element.element;
                var tagOffset = $currentTag.offset();
                var frameOffset = $(w.editor.iframeElement).offset();
                var scrollTop = $(w.editor.getBody()).scrollTop();
                
                var actualOffset = frameOffset.top + tagOffset.top + $currentTag.height();
                var docHeight = $(document.body).height();
                if (actualOffset+30 > docHeight) {
                    // TODO not working
                    // topLeft.top = actualOffset-(docHeight+30);
                }
                topLeft.top = actualOffset;// - (docHeight + scrollTop);
                topLeft.left = frameOffset.left + tagOffset.left;
                $popupEl.css({
                   top: topLeft.top+'px',
                   left: topLeft.left+'px'
                });
            }
        });
    }
    
    var doMouseOver = function() {
        clearTimeout(popupCloseId);
    }
    
    var doMouseOut = function() {
        popupCloseId = setTimeout(function() {
            $popupEl.popup('close');
        }, 500);
    }
    
    var doClick = function() {
        var url = $popupEl.popup('option', 'title');
        window.open(url);
    }
    
    var tagPopup = function(popupId) {
        setCurrentTag(popupId);
        
        var popText = null;
        var popKeys = w.schemaManager.mapper.getPopupAttributes();
        for (var i = 0; i < popKeys.length; i++) {
            var popAtt = $currentTag.attr(popKeys[i]);
            if (popAtt !== undefined) {
                popText = popAtt;
                break;
            }
        }
        
        if (popText != null) {
            $popupEl.parent().off('mouseover', doMouseOver);
            $popupEl.parent().off('mouseout', doMouseOut);
            $popupEl.parent().find('.ui-dialog-title').off('click', doClick);
            
            $popupEl.popup('option', 'dialogClass', 'tagPopup');
            $popupEl.popup('option', 'title', popText);
            $popupEl.popup('open');
            var width = $popupEl.parent().find('.ui-dialog-title').width();
            $popupEl.popup('option', 'width', width+30);
            doPosition();
            
            clearTimeout(popupCloseId);
            $currentTag.one('mouseout', function() {
                popupCloseId = setTimeout(function() {
                    $popupEl.popup('close');
                }, 1000);
            });
            
            $popupEl.parent().on('mouseover', doMouseOver);
            $popupEl.parent().on('mouseout', doMouseOut);
        }
    };
    
    var linkPopup = function(entityId) {
        setCurrentTag(entityId);
        
        var url = null;
        var urlKeys = w.schemaManager.mapper.getUrlAttributes();
        for (var i = 0; i < urlKeys.length; i++) {
            var urlAtt = $currentTag.attr(urlKeys[i]);
            if (urlAtt !== undefined) {
                url = urlAtt;
                break;
            }
        }
        
        if (url != null) {
            $popupEl.parent().off('mouseover', doMouseOver);
            $popupEl.parent().off('mouseout', doMouseOut);
            $popupEl.parent().find('.ui-dialog-title').off('click', doClick);
            
            $popupEl.popup('option', 'dialogClass', 'linkPopup');
            $popupEl.popup('option', 'title', url);
            $popupEl.popup('open');
            var width = $popupEl.parent().find('.ui-dialog-title').width();
            $popupEl.popup('option', 'width', width+30);
            doPosition();
            
            clearTimeout(popupCloseId);
            $currentTag.one('mouseout', function() {
                popupCloseId = setTimeout(function() {
                    $popupEl.popup('close');
                }, 1000);
            });
            
            $popupEl.parent().on('mouseover', doMouseOver);
            $popupEl.parent().on('mouseout', doMouseOut);
            $popupEl.parent().find('.ui-dialog-title').on('click', doClick);
        }
    };
    
    var popupMouseover = function(e) {
        var id = this.getAttribute('id') || this.getAttribute('name');
        tagPopup(id);
    }
    
    var linkMouseover = function(e) {
        var id = this.getAttribute('id') || this.getAttribute('name');
        linkPopup(id);
    }
    
    var setupListeners = function() {
        var body = $(w.editor.getBody());
        body.off('mouseover', popupSelector, popupMouseover);
        body.off('mouseover', linkSelector, linkMouseover);
        
        var popKeys = w.schemaManager.mapper.getPopupAttributes();
        popupSelector = '';
        $.map(popKeys, function(val, i) {
            popupSelector += '['+val+']';
            if (i < popKeys.length-1) popupSelector += ',';
        });
        if (popupSelector != '') {
            body.on('mouseover', popupSelector, popupMouseover);
        }
        
        var urlKeys = w.schemaManager.mapper.getUrlAttributes();
        linkSelector = '';
        $.map(urlKeys, function(val, i) {
            linkSelector += '['+val+']';
            if (i < urlKeys.length-1) linkSelector += ',';
        });
        if (linkSelector != '') {
            body.on('mouseover', linkSelector, linkMouseover);
        }
    }
    
    w.event('schemaLoaded').subscribe(setupListeners);
    
    return {
        show: function(config) {
            var type = config.type;
            if (type === 'link') {
                linkPopup(config.id);
            } else {
                tagPopup(config.id);
            }
        }
    }
}

});