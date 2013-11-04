(function($) {
    $.fn.extend({
        collapsiblePanel: function() {
            // Call the ConfigureCollapsiblePanel function for the selected element
            return $(this).each(function (index, el) {
                $(this).addClass("ui-widget");

                // Wrap the contents of the container within a new div.
                $(this).children().wrapAll("<div class='collapsibleContainerContent ui-widget-content ui-corner-bottom'></div>");

                // Create a new div as the first item within the container.  Put the title of the panel in here.
                $("<div class='collapsibleContainerTitle ui-widget-header ui-corner-top'><ins class='ui-icon ui-icon-triangle-1-se'>&nbsp;</ins><div>" + $(this).attr("title") + "</div></div>").prependTo($(this));

                // Assign a call to CollapsibleContainerTitleOnClick for the click event of the new title div.
                $(".collapsibleContainerTitle", this).click(CollapsibleContainerTitleOnClick);
            });
        }
    });

})(jQuery);

function CollapsibleContainerTitleOnClick() {
    // The item clicked is the title div... get this parent (the overall container) and toggle the content within it.
	$('ins', this).toggleClass('ui-icon-triangle-1-se').toggleClass('ui-icon-triangle-1-e');
	if ($(this).next().css('display') == 'none') $(this).removeClass('ui-corner-bottom'); 
    $(".collapsibleContainerContent", $(this).parent()).slideToggle(350, function() {
    	if ($(this).css('display') == 'none') {
    		$(this).prev().addClass('ui-corner-bottom');
    	}
    });
}