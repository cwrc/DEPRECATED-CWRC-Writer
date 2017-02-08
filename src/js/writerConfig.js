module.exports = {
    "cwrcRootUrl": "",
    "cwrcDialogs": {
        "cwrcApiUrl": "http://apps.testing.cwrc.ca/islandora/cwrc_entities/v1/",
        "repositoryBaseObjectUrl": "http://commons.cwrc.ca/",
        "geonameUrl": "http://apps.testing.cwrc.ca/cwrc-mtp/geonames/",
        "viafUrl": "http://apps.testing.cwrc.ca/services/viaf/",
        "googleGeocodeUrl": "http://maps.googleapis.com/maps/api/geocode/xml",
        "schemas": {
            "person": "http://cwrc.ca/schemas/entities.rng",
            "organization": "http://cwrc.ca/schemas/entities.rng",
            "place": "http://cwrc.ca/schemas/entities.rng"
        }
    },
    "schemas": {
        "tei": {
            "name": "CWRC Basic TEI Schema",
            "url": "http://cwrc.ca/schemas/cwrc_tei_lite.rng",
            "cssUrl": "http://cwrc.ca/templates/css/tei.css",
            "schemaMappingsId": "tei",
            "entityTemplates": {
                "note": "schema/tei/xml/note.xml",
                "citation": "schema/tei/xml/citation.xml"
            }
        },
        "events": {
            "name": "Events Schema",
            "url": "http://cwrc.ca/schemas/orlando_event_v2.rng",
            "cssUrl": "http://cwrc.ca/templates/css/orlando_v2_cwrc-writer.css",
            "schemaMappingsId": "orlando",
            "entityTemplates": {
                "note": "schema/orlando/xml/note_events.xml",
                "citation": "schema/orlando/xml/citation_events.xml"
            }
        },
        "biography": {
            "name": "Biography Schema",
            "url": "http://cwrc.ca/schemas/orlando_biography_v2.rng",
            "cssUrl": "http://cwrc.ca/templates/css/orlando_v2_cwrc-writer.css",
            "schemaMappingsId": "orlando",
            "entityTemplates": {
                "note": "schema/orlando/xml/note_biography.xml",
                "citation": "schema/orlando/xml/citation_biography.xml"
            }
        },
        "writing": {
            "name": "Writing Schema",
            "url": "http://cwrc.ca/schemas/orlando_writing_v2.rng",
            "cssUrl": "http://cwrc.ca/templates/css/orlando_v2_cwrc-writer.css",
            "schemaMappingsId": "orlando",
            "entityTemplates": {
                "note": "schema/orlando/xml/note_writing.xml",
                "citation": "schema/orlando/xml/citation_writing.xml"
            }
        },
        "cwrcEntry": {
            "name": "CWRC Entry Schema",
            "url": "http://cwrc.ca/schemas/cwrc_entry.rng",
            "cssUrl": "http://cwrc.ca/templates/css/cwrc.css",
            "schemaMappingsId": "cwrcEntry",
            "entityTemplates": {
                "note": "schema/cwrcEntry/xml/note.xml",
                "citation": "schema/cwrcEntry/xml/citation.xml"
            }
        }
    },
    "defaultDocument": "templates/letter"
};
