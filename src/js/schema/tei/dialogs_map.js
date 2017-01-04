var DialogForm = require('../../dialogs/dialogForm.js');

var citation = require('./dialogs/citation.js');
var correction = require('./dialogs/correction.js');
var date = require('./dialogs/date.js');
var keyword = require('./dialogs/keyword.js');
var link = require('./dialogs/link.js');
var note = require('./dialogs/note.js');
var org = require('./dialogs/org.js');
var person = require('./dialogs/person.js');
var place = require('./dialogs/place.js');
var title = require('./dialogs/title.js');

module.exports = {
    citation: citation,
    correction: correction,
    date: date,
    keyword: keyword,
    link: link,
    note: note,
    org: org,
    person: person,
    place: place,
    title: title
};