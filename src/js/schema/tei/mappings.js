define(['jquery', 'mapper'], function($, Mapper) {

return {

person: {
	parentTag: 'persName',
	textTag: '',
	mapping: function(entity) {
		var info = entity.info;
		var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
		var offsetId = entity.annotation.range.cwrcOffsetId;
		var duplicates = {};
		
		var xml = '<persName';
		if (id) xml += ' annotationId="'+id+'"';
		if (offsetId) xml += ' offsetId="'+offsetId+'"';
		if (info.certainty) {
			xml += ' cert="'+info.certainty+'"';
			duplicates.cert = true;
		}
		if (info.type) {
			xml += ' type="'+info.type+'"';
			duplicates.type = true;
		}
		if (info.role) xml += ' role="'+info.role+'"';
		if (info.cwrcInfo && info.cwrcInfo.id) xml += ' ref="'+info.cwrcInfo.id+'"';
		
		if (info.attributes) {
			var atts = info.attributes.persName;
			if (atts != null) {
				for (var key in duplicates) {
					delete atts[key];
				}
				xml += Mapper.getAttributeString(atts);
			}
		}
		
		xml += '>'+Mapper.TEXT_SELECTION+'</persName>';
		return xml;
	},
	reverseMapping: function(xml) {
		var obj = {};
		var $xml = $(xml);
		
		obj.cwrcInfo = {id: $xml.attr('ref')};
		obj.certainty = $xml.attr('cert');
		obj.type = $xml.attr('type');
		obj.role = $xml.attr('role');
		
		$xml.removeAttr('ref').removeAttr('cert').removeAttr('type').removeAttr('role');
		
		obj.attributes = Mapper.getAttributesFromXml(xml);
		
		return obj;
	}
},

org: {
	parentTag: 'orgName',
	textTag: '',
	mapping: function(entity) {
		var info = entity.info;
		var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
		var offsetId = entity.annotation.range.cwrcOffsetId;
		var duplicates = {};
		
		var xml = '<orgName';
		if (id) xml += ' annotationId="'+id+'"';
		if (offsetId) xml += ' offsetId="'+offsetId+'"';
		if (info.certainty) {
			xml += ' cert="'+info.certainty+'"';
			duplicates.cert = true;
		}
		if (info.cwrcInfo && info.cwrcInfo.id) xml += ' ref="'+info.cwrcInfo.id+'"';
		
		if (info.attributes) {
			var atts = info.attributes.orgName;
			if (atts != null) {
				for (var key in duplicates) {
					delete atts[key];
				}
				xml += Mapper.getAttributeString(atts);
			}
		}
		
		xml += '>'+Mapper.TEXT_SELECTION+'</orgName>';
		return xml;
	},
	reverseMapping: function(xml) {
		var obj = {};
		var $xml = $(xml);
		
		obj.cwrcInfo = {id: $xml.attr('ref')};
		obj.certainty = $xml.attr('cert');
		
		$xml.removeAttr('ref').removeAttr('cert');
		
		obj.attributes = Mapper.getAttributesFromXml(xml);
		
		return obj;
	}
},

place: {
	parentTag: 'placeName',
	textTag: 'placeName',
	mapping: function(entity) {
		var info = entity.info;
		var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
		var offsetId = entity.annotation.range.cwrcOffsetId;
		
		var xml = '<placeName';
		if (id) xml += ' annotationId="'+id+'"';
		if (offsetId) xml += ' offsetId="'+offsetId+'"';
		if (info.certainty) xml += ' cert="'+info.certainty+'"';
		if (info.cwrcInfo && info.cwrcInfo.id) xml += ' ref="'+info.cwrcInfo.id+'"';
		xml += '>'+Mapper.TEXT_SELECTION+'';
		if (info.precision) {
			xml += '<precision';
			if (id) xml += ' annotationId="'+id+'"';
			xml += ' precision="'+info.precision+'" />';
		}
		xml += '</placeName>';
		return xml;
	},
	reverseMapping: function(xml) {
		var obj = {};
		var $xml = $(xml);
		
		obj.cwrcInfo = {id: $xml.attr('ref')};
		obj.certainty = $xml.attr('cert');
		obj.precision = $xml.children('precision').attr('precision');
		
		$xml.removeAttr('ref').removeAttr('cert');
		$xml.children('precision').remove();
		
		obj.attributes = Mapper.getAttributesFromXml(xml);
		
		return obj;
	}
},

title: {
	parentTag: 'title',
	textTag: '',
	mapping: function(entity) {
		var info = entity.info;
		var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
		var offsetId = entity.annotation.range.cwrcOffsetId;
		var duplicates = {};
		
		var xml = '<title';
		if (id) xml += ' annotationId="'+id+'"';
		if (offsetId) xml += ' offsetId="'+offsetId+'"';
		if (info.cwrcInfo && info.cwrcInfo.id) xml += ' ref="'+info.cwrcInfo.id+'"';
		if (info.certainty) {
			xml += ' cert="'+info.certainty+'"';
			duplicates.cert = true;
		}
		if (info.level) xml += ' level="'+info.level+'"';
		
		if (info.attributes) {
			var atts = info.attributes.title;
			if (atts != null) {
				for (var key in duplicates) {
					delete atts[key];
				}
				xml += Mapper.getAttributeString(atts);
			}
		}
		
		xml += '>'+Mapper.TEXT_SELECTION+'</title>';
		return xml;
	},
	reverseMapping: function(xml) {
		var obj = {};
		var $xml = $(xml);
		
		obj.cwrcInfo = {id: $xml.attr('ref')};
		obj.certainty = $xml.attr('cert');
		obj.level = $xml.attr('level');
		
		$xml.removeAttr('ref').removeAttr('cert').removeAttr('level');
		
		obj.attributes = Mapper.getAttributesFromXml(xml);
		
		return obj;
	}
},

correction: {
	parentTag: ['choice', 'corr'],
	textTag: 'sic',
	mapping: function(entity) {
		var info = entity.info;
		var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
		var offsetId = entity.annotation.range.cwrcOffsetId;
		
		var xml;
		if (info.corrText) {
			xml = '<choice';
			if (id) xml += ' annotationId="'+id+'"';
			if (offsetId) xml += ' offsetId="'+offsetId+'"';
			xml += '>';
			xml += '<sic';
			if (id) xml += ' annotationId="'+id+'"';
			xml += '>'+Mapper.TEXT_SELECTION+'</sic>';
			xml += '<corr';
			if (id) xml += ' annotationId="'+id+'"';
			xml += '>'+info.corrText+'</corr></choice>';
		} else {
			xml = '<corr';
			if (id) xml += ' annotationId="'+id+'"';
			if (offsetId) xml += ' offsetId="'+offsetId+'"';
			xml += '>'+Mapper.TEXT_SELECTION+'</corr>';
		}
		return xml;
	},
	reverseMapping: function(xml) {
		var obj = {};
		var $xml = $(xml);
		
		if (xml.nodeName === 'choice') {
			obj.corrText = $xml.find('corr').text();
			obj.sicText = $xml.find('sic').text();
		} else {
			obj.corrText = $xml.text();
		}
		
		return obj;
	}
},

link: {
	parentTag: 'ref',
	textTag: '',
	mapping: function(entity) {
		var info = entity.info;
		var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
		var offsetId = entity.annotation.range.cwrcOffsetId;
		
		var xml = '<ref';
		if (id) xml += ' annotationId="'+id+'"';
		if (offsetId) xml += ' offsetId="'+offsetId+'"';
		if (info.url) xml += ' target="'+info.url+'"';
		xml += '>'+Mapper.TEXT_SELECTION+'</ref>';
		return xml;
	},
	reverseMapping: function(xml) {
		var obj = {};
		var $xml = $(xml);
		
		obj.url = $xml.attr('target');
		
		return obj;
	}
},

date: {
	parentTag: 'date',
	textTag: '',
	mapping: function(entity) {
		var info = entity.info;
		var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
		var offsetId = entity.annotation.range.cwrcOffsetId;
		var duplicates = {};
		
		var xml = '<date';
		if (id) xml += ' annotationId="'+id+'"';
		if (offsetId) xml += ' offsetId="'+offsetId+'"';
		if (info.certainty) {
			xml += ' cert="'+info.certainty+'"';
			duplicates.cert = true;
		}
		if (info.date) {
			xml += ' when="'+info.date+'"';
		} else if (info.startDate) {
			xml += ' from="'+info.startDate+'" to="'+info.endDate+'"';
		}
		
		if (info.attributes) {
			var atts = info.attributes.date;
			if (atts != null) {
				for (var key in duplicates) {
					delete atts[key];
				}
				xml += Mapper.getAttributeString(atts);
			}
		}
		
		xml += '>'+Mapper.TEXT_SELECTION+'</date>';
		return xml;
	},
	reverseMapping: function(xml) {
		var obj = {};
		var $xml = $(xml);
		
		obj.certainty = $xml.attr('cert');
		$xml.removeAttr('cert');
		
		if ($xml.attr('when')) {
			obj.date = $xml.attr('when');
			$xml.removeAttr('when');
		} else {
			obj.startDate = $xml.attr('from');
			obj.endDate = $xml.attr('to');
			$xml.removeAttr('from').removeAttr('to');
		}
		
		obj.attributes = Mapper.getAttributesFromXml(xml);
		
		return obj;
	}
},

note: {
	parentTag: 'note',
	textTag: '',
	mapping: function(entity) {
		var info = entity.info;
		var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
		var offsetId = entity.annotation.range.cwrcOffsetId;
		
		var xml = '<note';
		if (id) xml += ' annotationId="'+id+'"';
		if (offsetId) xml += ' offsetId="'+offsetId+'"';
		xml += ' resp="'+getResp()+'"';
		if (info.type) {
			xml += ' type="'+info.type+'"';
		}
		xml += '>';
		if (info.content) {
			var xmlDoc = w.utilities.stringToXML(info.content);
			var noteContent = $('note', xmlDoc)[0];
			xml += noteContent.innerHTML;
		}
		xml += '</note>';
		return xml;
	},
	reverseMapping: function(xml) {
		var obj = {};
		var $xml = $(xml);
		
		obj.resp = $xml.attr('resp');
		obj.type = $xml.attr('type');
		obj.content = w.utilities.xmlToString(xml);
		
		return obj;
	}
},

citation: {
	parentTag: 'note',
	textTag: '',
	mapping: function(entity) {
		var info = entity.info;
		var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
		var offsetId = entity.annotation.range.cwrcOffsetId;
		
		var xml = '<note';
		if (id) xml += ' annotationId="'+id+'"';
		if (offsetId) xml += ' offsetId="'+offsetId+'"';
		xml += ' resp="'+getResp()+'"';
		xml += ' type="citation"><bibl';
		if (info.cwrcInfo && info.cwrcInfo.id) xml += ' ref="'+info.cwrcInfo.id+'"';
		xml += '>';
		if (info.content) {
			var xmlDoc = w.utilities.stringToXML(info.content);
			var biblContent = $('bibl', xmlDoc)[0];
			xml += biblContent.innerHTML;
		}
		xml += '</bibl></note>';
		return xml;
	},
	reverseMapping: function(xml) {
		var obj = {};
		var $xml = $(xml);
		
		obj.cwrcInfo = {id: $xml.children('bibl').attr('ref')};
		obj.resp = $xml.attr('resp');
		obj.content = w.utilities.xmlToString(xml);
		
		return obj;
	}
},

keyword: {
	parentTag: 'note',
	textTag: '',
	mapping: function(entity) {
		var info = entity.info;
		var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
		var offsetId = entity.annotation.range.cwrcOffsetId;
		
		var xml = '';
		for (var i = 0; i < info.keywords.length; i++) {
			xml += '<note type="keyword"';
			if (id) xml += ' annotationId="'+id+'"';
			if (offsetId) xml += ' offsetId="'+offsetId+'"';
			xml += ' resp="'+getResp()+'"';
			xml +='><term';
			if (id) xml += ' annotationId="'+id+'"';
			xml +='>'+info.keywords[i]+'</term></note>';
		}
		return xml;
	},
	reverseMapping: function(xml) {
		var obj = {};
		var $xml = $(xml);
		
		obj.resp = $xml.attr('resp');
		obj.keywords = [$xml.children('term').text()];
		
		return obj;
	}
},

event: {
	parentTag: '',
	textTag: '',
	mapping: function(entity) {
	},
	reverseMapping: function(xml) {
	}
}

};

});