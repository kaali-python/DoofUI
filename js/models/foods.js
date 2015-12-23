define(function (require) {
	'use strict';

	var Backbone = require('backbone');

	var Food = Backbone.Model.extend();

	return Backbone.Collection.extend({
		url: window.get_eatery,
		model: Food,
		parse: function (response) {
			return response.result;
		}
	});
});