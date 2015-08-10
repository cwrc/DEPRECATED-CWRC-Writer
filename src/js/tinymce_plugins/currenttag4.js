tinymce.PluginManager.add('cwrcpath', function(editor) {
    tinymce.ui.CWRCPath = tinymce.ui.ElementPath.extend({
        postRender: function() {
            var self = this;

            function isHidden(elm) {
                if (elm.nodeType === 1) {
                    if (elm.nodeName == "BR" || !!elm.getAttribute('data-mce-bogus')) {
                        return true;
                    }

                    if (elm.getAttribute('data-mce-type') === 'bookmark') {
                        return true;
                    }
                }

                return false;
            }

//            if (editor.settings.elementpath !== false) {
                self.on('select', function(e) {
//                    editor.focus();
//                    editor.selection.select(this.row()[e.index].element);
//                    editor.nodeChanged();
                    var el = this.row()[e.index].element;
                    var id = el.getAttribute('id');
                    editor.writer.selectStructureTag(id, false);
                });

                editor.on('nodeChange', function(e) {
                    var outParents = [], parents = e.parents, i = parents.length;

                    while (i--) {
                        var n = parents[i];
                        if (n.nodeType == 1 && !isHidden(n)) {
                            var tag = n.getAttribute('_tag');
                            var id = n.getAttribute('id');
                            if (id === 'entityHighlight') {
                                var w = editor.writer;
                                id = w.entitiesManager.getCurrentEntity();
                                tag = w.entitiesManager.getEntity(id).getTag();
                            }
                            if (tag != null) {
                                outParents.push({name: tag, element: n});
                            }
                        }
                    }

                    self.row(outParents);
                });
//            }

            return self._super();
        }
    });
    
    
    var path = new tinymce.ui.CWRCPath(editor);
});