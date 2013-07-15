<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB">
    <head>
    	<meta http-equiv="cache-control" content="no-cache"></meta>
    	<meta http-equiv="Content-type" content="text/html;charset=UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=Edge" />
      <title>DHSI CWRICWriter</title>
      
		<script type="text/javascript" src="js/lib/jquery/jquery-1.8.3.js"></script>
		<script type="text/javascript" src="js/lib/jquery/jquery-ui-1.9.0.custom.js"></script>
		<script type="text/javascript" src="js/lib/jquery/jquery.layout-latest.min.js"></script>
		<script type="text/javascript" src="js/lib/jquery/jquery.layout.resizeTabLayout-1.3.js"></script>
		<script type="text/javascript" src="js/lib/jquery/jquery.contextmenu.js"></script>
		<script type="text/javascript" src="js/lib/jquery/jquery.tmpl.min.js"></script>
		<script type="text/javascript" src="js/lib/jquery/jquery.watermark.min.js"></script>
		
		<script type="text/javascript" src="js/lib/tinymce/tiny_mce.js"></script>
		<script type="text/javascript" src="js/lib/tinymce/copy_event.js"></script>
		
		<script type="text/javascript" src="js/lib/tinymce/jquery.tinymce.js"></script>
		<script type="text/javascript" src="js/lib/jstree/jquery.hotkeys.js"></script>
		<!-- can't use jquery.jtree.min.js due to modification -->
		<script type="text/javascript" src="js/lib/jstree/jquery.jstree.js"></script>
		<script type="text/javascript" src="js/lib/snippet/jquery.snippet.min.js"></script>
		<script type="text/javascript" src="js/lib/moment/moment.min.js"></script>
		<script type="text/javascript" src="js/lib/objtree/ObjTree.js"></script>
		
		<script type="text/javascript" src="js/dialogs/dialog_addevent.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_addorg.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_addperson.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_addplace.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_citation.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_correction.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_date.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_header.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_keyword.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_link.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_message.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_note.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_search.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_settings.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_title.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_triple.js"></script>
		<script type="text/javascript" src="js/dialogs/dialog_filemanager.js"></script>
		<script type="text/javascript" src="js/editor.js"></script>
		<script type="text/javascript" src="js/tagger.js"></script>
		<script type="text/javascript" src="js/dialog.js"></script>
		<script type="text/javascript" src="js/utilities.js"></script>
		<script type="text/javascript" src="js/filemanager.js"></script>
		<script type="text/javascript" src="js/structuretree.js"></script>
		<script type="text/javascript" src="js/entitieslist.js"></script>
		<script type="text/javascript" src="js/entities_model.js"></script>
		<script type="text/javascript" src="js/relations.js"></script>
		<script type="text/javascript" src="js/validation.js"></script>
		<script type="text/javascript" src="js/delegator.js"></script>

      <!-- CWRC stylesheets -->

      <script type="text/javascript" src="Islandora/js/startup.js"></script>
      <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />

      <!-- Canvas js -->
      <script src="impl/js/jquery.rdfquery.rdfa.min-1.1.js" type="text/javascript"></script>
      <script src="impl/js/jquery.rdf.turtle.js" type="text/javascript"></script>

      <script src="impl/js/jquery.touchSwipe-1.2.4.js" type="text/javascript"></script>
      <script src="impl/js/jquery.jplayer.min.js" type="text/javascript"></script>

      <script src="impl/js/raphael.js" type="text/javascript"></script>
      <script src="impl/js/scale.raphael.js" type="text/javascript"></script>
      <script src="impl/js/uuid.js" type="text/javascript"></script>

      <script src="impl/js/ContextMenu/src/jquery.contextMenu.js" type="text/javascript"></script>
      <link href="impl/js/ContextMenu/src/jquery.contextMenu.css" rel="stylesheet" type="text/css" />

      <script src="impl/stable/islandora_emic_init.js" type="text/javascript"></script>
      <script src="impl/stable/sc_ui.js" type="text/javascript"></script>
      <script src="impl/stable/sc_utils.js" type="text/javascript"></script>

      <script src="impl/stable/sc_rdf.js" type="text/javascript"></script>
      <script src="impl/stable/sc_rdfjson.js" type="text/javascript"></script>
      <script src="impl/stable/sc_create.js" type="text/javascript"></script>
      <script src="impl/stable/sc_gdata.js" type="text/javascript"></script>
      <script src="impl/stable/sc_pastebin.js" type="text/javascript"></script>


      <!-- Color selector -->
      <script type="text/javascript" src="impl/js/jquery/jquery.miniColors.js"></script>
      <link type="text/css" rel="stylesheet" href="impl/css/jquery.miniColors.css" />

      <script type="text/javascript">
			window.addEventListener('beforeunload', function(e) {
				if (this.tinymce.get('editor').isDirty()) {
					var msg = 'You have unsaved changes.';
					(e || window.event).returnValue = msg;
					return msg;
				}
			});
		</script>
		
      <!-- Canvas css -->
      <link rel="stylesheet" href="impl/css/sc.css" type="text/css" />
      <link rel="stylesheet" href="impl/css/emic_canvas.css" type="text/css" />

      <!-- CWRC stylesheets -->
	  <link type="text/css" rel="stylesheet" href="css/style.css" />
	  <link type="text/css" rel="stylesheet" href="css/islandora_style.css" />

    </head>
    <body>
<div id="header" class="ui-layout-north">
	<div id="page_selector">Loading....</div>
	<div id="header-inner">
		<div class="header-nav">
			<a href="" id="page-prev"></a> <a href="" id="page-next"></a>
		</div>
		<h1>DHSI CWRCWriter</h1>
	</div>
	<div id="pageChange"></div>
	<div id="headerButtons"></div>
</div>
<div class="ui-layout-west">
	<div id="westTabs" class="tabs">
		<ul>
			<li><a href="#entities">Entities</a></li>
			<li><a href="#structure">Structure</a></li>
			<li><a href="#relations">Relations</a></li>
			<li id="annotation_tab"><a href="#image-annotations">Image Annotations</a></li>
		</ul>
		<div id="westTabsContent" class="ui-layout-content">
			<div id="image-annotations">
				<div id="comment_annos_block"></div>
			</div>
		</div>
	</div>
</div>
<div id="main" class="ui-layout-center">
	<div class="ui-layout-center">
		<form method="post" action="">
			<textarea id="editor" name="editor" class="tinymce"></textarea>
		</form>
	</div>
	<div class="ui-layout-south">
		<div id="southTabs" class="tabs">
			<ul>
				<li><a href="#validation">Validation</a></li>
			</ul>
			<div id="southTabsContent" class="ui-layout-content"></div>
		</div>
	</div>
</div>
<div class="ui-layout-east">
	<!-- Image annotation -->
	<button id="create_annotation" class="menu_button">Annotate</button>
	<div class="image-annotation-wrapper">

		<!-- Persist a single player and build new interface to it -->
		<div id="canvas-body-wrapper" style="width: 100%; height: 800px;">
			<div id="canvas-body">

				<ul class="menu_body" id="show_body">
					<li class="show_sort" id="li_comment"><span
						class="ui-icon ui-icon-arrowthick-2-n-s"></span> <span
						style="margin-left: 10px">Commentary:</span> <span
						style="float: right"><input id="check_show_comment"
							type="checkbox" checked="checked"></input> </span></li>

					<li class="show_sort" id="li_audio"><span
						class="ui-icon ui-icon-arrowthick-2-n-s"></span> <span
						style="margin-left: 10px">Audio: </span> <span
						style="float: right"><input id="check_show_audio"
							type="checkbox" checked="checked"></input></span> <br /> <span>Volume:</span>
						<div id="slider_volume" style="height: 8px;"></div></li>
					<li class="show_sort" id="li_text"><span
						class="ui-icon ui-icon-arrowthick-2-n-s"></span> <span
						style="margin-left: 10px">Texts: </span> <span
						style="float: right"><input id="check_show_text"
							type="checkbox" checked="checked"></input></span></li>
					<li class="show_sort" id="li_detailImg"><span
						class="ui-icon ui-icon-arrowthick-2-n-s"></span> <span
						style="margin-left: 10px">Detail Images: </span> <span
						style="float: right"><input id="check_show_detailImg"
							type="checkbox" checked="checked"></input></span></li>
					<li class="show_sort" id="li_baseImg"><span
						class="ui-icon ui-icon-arrowthick-2-n-s"></span> <span
						style="margin-left: 10px">Base Images:</span> <span
						style="float: right"><input id="check_show_baseImg"
							type="checkbox" checked="checked"></input></span></li>
				</ul>

				<ul class="menu_body" id="view_body">
					<li>Show Image Selection: <span style="float: right"><input
							id="check_view_imgSel" type="checkbox"></input></span></li>
					<li>Number of Folios: <span style="float: right"
						id="viewNumCanvas">1</span>
						<div id="slider_folios" style="height: 8px;"></div></li>
					<li>Show Zoom Button: <span style="float: right"><input
							id="check_view_zpr" type="checkbox"></input></span></li>
					<li>Show Canvas URI: <span style="float: right"><input
							id="check_view_uri" type="checkbox"></input></span></li>
				</ul>

				<!--  Wrapper to create Canvas divs in -->
				<div id="canvases"></div>

				<!--  Wrapper to create SVG divs in -->
				<div id="svg_wrapper"></div>

				<!--  Wrapper to create annotations in, then reposition -->
				<div id="annotations"></div>

				<!-- Progress bar -->
				<div id="loadprogress"></div>

				<!--  At least one visible image needed for GData transport -->
				<div class="shared-canvas-logo" style="font-size: 8pt">
					<img height="25" src="impl/imgs/small-logo.png"
						style="padding: 0px; margin: 0px; border: 0px; border-top: 2px;" />
					Powered by SharedCanvas
				</div>

			</div>
		</div>
	</div>
</div>
<div id="footer" class="ui-layout-south">
	<p>Brought to you by <a href="http://editingmodernism.ca/" title="Editing Modernism in Canada" target="_blank">EMiC</a></p>
</div>
<div id="dialogs">
	<!-- Image annotation box -->
	<div id="create_annotation_box" style="width: 380px"
		class="dragBox ui-dialog ui-widget ui-corner-all ui-draggable ui-resizable">
		<div id="create_annos_header"
			class="dragHead ui-dialog-titlebar ui-widget-header ui-corner-all">
			<span>Annotate</span>

		</div>
		<!-- Annotation shapes -->
		<div style="display: inline; margin-top: 3px; padding-left: 5px;">
			<img id="annoShape_rect" class="annoShape" src="imgs/draw_rect.png"
				style="padding-left: 2px; padding-top: 1px;" /> <img
				id="annoShape_circ" class="annoShape" src="imgs/draw_circ.png"
				style="padding-left: 1px;" /> <img id="annoShape_poly"
				class="annoShape" src="imgs/draw_poly.png" style="padding: 2px;" />
			<hr style="margin: 0px; padding: 0px; height: 1px;" />
		</div>
		<div id="create_annos_block" class="dragBlock">
			<!-- Annotation Title -->

			<div class="element-wrap">
				<label for="anno_title">Title:</label> <input id="anno_title"
					type="text" size="28"></input>
			</div>

			<div id="islandora_classification" class="element-wrap">
				<label for="anno_type">Type:</label> <input
					id="anno_classification" type="text" size="28"></input>
			</div>


			<div id="color-picker-wrapper" class="element-wrap">
				<label for="anno_color">Color:</label> <input id="anno_color"
					type="hidden" name="color4" value="#91843c" class="color-picker"
					size="7" /> <input id="anno_color_activated" type="hidden"
					value="" size="7" />
			</div>


			<div class="element-wrap">
				<label for="anno_text">Annotation:</label>
				<textarea id="anno_text" cols="40" rows="5"></textarea>
			</div>
			<!-- Services - to be removed -->
			<span style="width: 200px; margin: 0px; padding: 0px; float: left">
				<ul id="create_body" style="width: 200px; list-style: none; font-size: 10pt; margin: 0; padding: 0;">
				</ul>
			</span>
			<!-- Cancel/Save buttons -->
			<span style="float: right; padding-top: 3px;">
				<button class="diabutton" id="cancelAnno">Cancel</button>
				<button class="diabutton" id="saveAnno">Save</button>
			</span>
		</div>
	</div>
</div>
    </body>
</html>
