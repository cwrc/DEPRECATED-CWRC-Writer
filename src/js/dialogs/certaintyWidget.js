define(['jquery'], function($) {

return function(config) {
    var parentId = config.parentId;
    
    var parent = $('#'+parentId);
    parent.append(''+
    '<p>This identification is:</p>'+
    '<input type="radio" id="'+parentId+'_definite" name="'+parentId+'_id_certainty" value="definite" /><label for="'+parentId+'_definite">Definite</label>'+
    '<input type="radio" id="'+parentId+'_reasonable" name="'+parentId+'_id_certainty" value="reasonably certain" /><label for="'+parentId+'_reasonable">Reasonably Certain</label>'+
    '<input type="radio" id="'+parentId+'_probable" name="'+parentId+'_id_certainty" value="probable" /><label for="'+parentId+'_probable">Probable</label>'+
    '<input type="radio" id="'+parentId+'_speculative" name="'+parentId+'_id_certainty" value="speculative" /><label for="'+parentId+'_speculative">Speculative</label>');
    
    parent.buttonset();
    $('input', parent).change(function() {
        parent.trigger('valueChanged', [$(this).val()]);
    });
    
    return {
        el: parent,
        reset: function() {
            $('input:checked', parent).prop('checked', false).button('refresh');
            $('input[value="definite"]', parent).prop('checked', true).button('refresh');
        },
        setValue: function(val) {
            $('input[value="'+val+'"]', parent).prop('checked', true).button('refresh');
        },
        getValue: function() {
            return $('input:checked', parent).val(); 
        }
    };
};

});