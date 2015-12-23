define(function(require) {

	"use strict";

	var Marionette=  require('backbone.marionette');

	var self;

	var Router= Marionette.AppRouter.extend({
		initialize: function(opts) {
			self= this;
			this.doofRegion= opts.doofRegion;

			this.user= opts.user;
		},
		appRoutes: {
			"": "landingPage",
			"application": "application"
		},
		controller: {
			"landingPage": function() {
				var LandingPage= require('./landingPage/i-landingPage');
				var landingPage= new LandingPage({user: self.user});
				self.doofRegion.show(landingPage);
			},
			"application": function() {
				var ApplicationView= require('./application/l-applicationView');
				var applicationView= new ApplicationView({user: self.user});
				self.doofRegion.show(applicationView);
			}
		}
	});

	return Router;
});