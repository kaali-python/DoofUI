define(function (require) {

	"use strict";

	var $ = require('jquery');
	var _ = require('underscore');
	var Handlebars = require('handlebars');
	var Marionette = require('marionette');
	var Template = require('text!./restaurant.html');

	var Radio = require('radio');

	function escapeHtml(text) {
		return text
      .replace(/&amp;/g, '&');
	}

	function simpleAddress(input) {
		var output= '';
		if(input) {
			var split_input= input.split(',');
			output= split_input[split_input.length-2]+', '+ split_input[split_input.length-1];
		} else {
			output= input;
		}
		return output;
	}

	Handlebars.registerHelper('if_eq', function (a, b, opts) {
		if (a == b) {// Or === depending on your needs
			return opts.fn(this);
		} else {
			return opts.inverse(this);
		}
	});



	Handlebars.registerHelper("log", function (something) {
		console.log(something);
	});



	var current_list = "";

	var RestaurantView = Marionette.ItemView.extend({
		className: 'restaurant-list-item2 card-panel',
		template: Handlebars.compile(Template),
		initialize: function () {
			// console.log('yo man');
			this.applicationChannel = Radio.channel('application');
		},
		attributes: function () {
			return {
				'eatery-id': this.model.get('__eatery_id')
			};
		},
		events: {
			'mouseenter .restaurant-list': 'highlight',
			'mouseleave .restaurant-list': 'unhighlight',
			'click .restaurant-list': 'show',
			'mouseenter .restaurant-photo': 'highlight',
			'mouseleave .restaurant-photo': 'unhighlight',
			'click .restaurant-photo': 'show'
		},
		highlight: function () {
			$(this.el).addClass('active');
			// this.applicationChannel.trigger("highlightMarker:restaurant", this.model.get('__eatery_id'));
			this.triggerMethod('highlight:marker', this.model.get('__eatery_id'));
		},
		unhighlight: function () {
			$(this.el).removeClass('active');
			this.applicationChannel.trigger("unhighlight:marker", this.model.get('__eatery_id'));
			// this.triggerMethod('itemview:unhighlightMarker:restaurant', this.model.get('__eatery_id'));
		},
		show: function () {
			this.triggerMethod('open:restaurant', this.model.get('__eatery_id'), this.model.toJSON());
			// this.applicationChannel.trigger("show:restaurant", this.model.get('__eatery_id'), this.model.toJSON());
			// this.triggerMethod('itemview:show:restaurant', this.model.get('__eatery_id'), this.model.toJSON());
		},
		templateHelpers: {
			index: function() {
				return this._index+1;
			},
			newCategory: function () {
				if (current_list !== this.model.get('category')) {
					current_list = this.model.get('category');
					if (current_list) {
						if (current_list === 'food') {
							return { status: true, value: "Trending food" };
						} else {
							return { status: true, value: "Trending " + current_list + " restaurants" };
						}
					} else {
						return { status: false };
					}
				} else {
					return { status: false };
				}
			},
			isFood: function () {
				return this.model.get('category') === 'food';
			},
			sentiment: function () {
				var data = this.model.toJSON();
				var keys = ['excellent', 'good', 'average', 'poor', 'terrible'];
				var highest = '', highestValue = 0;
				_.each(keys, function (key, i) {
					if (data.hasOwnProperty(key)) {
						if (data[key] > highestValue) {
							highest = key;
							highestValue = data[key];
						}
					} else {
						if (data.eatery_details) {
							if (data.eatery_details.overall[key] > highestValue) {
								highest = key;
								highestValue = data[key];
							}
						}
					}
				});
				return highest;
			},
			escapedRestaurantName: function () {
				return escapeHtml(this.model.get('eatery_details').eatery_name);
			},
			escapedName: function () {
				if (this.model.get('name')) {
					return escapeHtml(this.model.get('name'));
				} else if (this.model.get('eatery_details').eatery_name) {
					return escapeHtml(this.model.get('eatery_details').eatery_name);
				}
			},
			escapedAddreess: function () {
				var eatery_details = this.model.get('eatery_details');
				var address = '';
				if (eatery_details) {
					address = eatery_details.eatery_address;
				} else {
					if (this.model.get('eatery_address')) {
						address = this.model.get('eatery_address');
					}
				}
				return simpleAddress(escapeHtml(address));
			},
			top_foods: function () {
				var foods = [];
				var eatery_details = this.model.get('eatery_details');
				var top_foods = '';
				if (eatery_details && eatery_details.food.dishes.length) {
					for (var i = 0; i < eatery_details.food.dishes.length; i++) {
						foods.push(eatery_details.food.dishes[i].name);
						top_foods += eatery_details.food.dishes[i].name;
						if (i !== eatery_details.food.dishes.length - 1) {
							top_foods += " ,";
						}
					}
				}

				return foods;
			},
			restaurant_overall_sentiment: function () {
				var terrible, poor, average, mix, good, excellent, total_sentiments = 0;
				if (this.model.get('category') === 'food') {
					terrible = this.model.get('terrible') ? this.model.get('terrible') : 0;
					poor = this.model.get('poor') ? this.model.get('poor') : 0;
					average = this.model.get('average') ? this.model.get('average') : 0;
					mix = this.model.get('mix') ? this.model.get('mix') : 0;
					good = this.model.get('good') ? this.model.get('good') : 0;
					excellent = this.model.get('excellent') ? this.model.get('excellent') : 0;
					total_sentiments = this.model.get('total_sentiments') ? this.model.get('total_sentiments') : 1;
				} else {
					terrible = this.model.get('eatery_details').overall.terrible ? this.model.get('eatery_details').overall.terrible : 0;
					poor = this.model.get('eatery_details').overall.poor ? this.model.get('eatery_details').overall.poor : 0;
					average = this.model.get('eatery_details').overall.average ? this.model.get('eatery_details').overall.average : 0;
					mix = this.model.get('eatery_details').overall.mix ? this.model.get('eatery_details').overall.mix : 0;
					good = this.model.get('eatery_details').overall.good ? this.model.get('eatery_details').overall.good : 0;
					excellent = this.model.get('eatery_details').overall.excellent ? this.model.get('eatery_details').overall.excellent : 0;
					total_sentiments = this.model.get('eatery_details').overall.total_sentiments ? this.model.get('eatery_details').overall.total_sentiments : 1;
				}

				// console.log(this.model.get('eatery_details').eatery_name, terrible, poor, average, mix, good, excellent, total_sentiments);
				return ((0 * terrible + 2.5 * poor + 4.8 * average + 5.2 * mix + 7.5 * good + 10 * excellent) / total_sentiments).toFixed(1);
			}
		}
	});

	var EmptyReview= Marionette.ItemView.extend({
		initialize: function(opts) {
			if(!opts.isError) {
				this.template= Handlebars.compile('<img src="css/images/no-review.png" alt="" class="responsive-img empty-reviews__image"> <div class="no-review-text">No Restaurant found!</div>');
			} else {
				this.template= Handlebars.compile('<img src="css/images/no-review.png" alt="" class="responsive-img empty-reviews__image"> <div class="error-text">'+ opts.errorMessage +' </div>')
			}
		},
		className: 'restaurants-empty-view'
	});

	// var ErrorReview= Marionette.ItemView.extend({
	// 	initialize: function(opts) {
	// 		this.message= opts.message;
	// 	},
	// 	className: 'restaurants-error-view',
	// 	template: Handlebars.compile('<img src="css/images/no-review.png" alt="" class="responsive-img empty-reviews__image"> <div class="error-text">'+ this.message +' </div>')
	// });

	var RestaurantsListView = Marionette.CollectionView.extend({
		id: 'restaurants-list-view',
		emptyView: EmptyReview,
		emptyViewOptions: {
			isError: false,
			errorMessage: ''
		},
		childView: RestaurantView,
		updateCollection: function (newCollection) {
			this.collection = newCollection;
			this.render();
		},
		showErrorMessage: function(errorMessage) {
			this.emptyViewOptions.isError= true;
			this.emptyViewOptions.errorMessage= errorMessage;
			this.render();
		},
		updateData: function(newData) {
			this.collection= newData;
			this.render();
		}
	});

	return RestaurantsListView;
});