// custom extension of dialog that removes focus/unfocus functions
$.widget( "custom.popup", $.ui.dialog, {
    version: "1.10.4",
    close: function( event ) {
        var that = this;

        if ( !this._isOpen || this._trigger( "beforeClose", event ) === false ) {
            return;
        }

        this._isOpen = false;
        this._destroyOverlay();

        this._hide( this.uiDialog, this.options.hide, function() {
            that._trigger( "close", event );
        });
    },

    open: function() {
        var that = this;
        if ( this._isOpen ) {
            if ( this._moveToTop() ) {
                //this._focusTabbable();
            }
            return;
        }

        this._isOpen = true;
        this.opener = $( this.document[0].activeElement );

        this._size();
        this._position();
        this._createOverlay();
        this._moveToTop( null, true );
        
        this._show( this.uiDialog, this.options.show, function() {
            //that._focusTabbable();
            //that._trigger("focus");
        });

        this._trigger("open");
    }
});