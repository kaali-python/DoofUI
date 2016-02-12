define(function (require) {

    "use strict";

    var _ = require('underscore');
    var Backbone = require('backbone');
    var Marionette = require('marionette');

    var User = require('./models/user');
    var Router = require('./router');

    // extra code to add template helper functionality to marionnete view.
    Backbone.Marionette.ItemView.prototype.mixinTemplateHelpers = function (target) {
        var self = this;
        var templateHelpers = Marionette.getOption(self, "templateHelpers");
        var result = {};

        target = target || {};

        if (_.isFunction(templateHelpers)) {
            templateHelpers = templateHelpers.call(self);
        }

        // This _.each block is what we're adding
        _.each(templateHelpers, function (helper, index) {
            if (_.isFunction(helper)) {
                result[index] = helper.call(self);
            } else {
                result[index] = helper;
            }
        });

        return _.extend(target, result);
    };


    var Doof = new Marionette.Application();

    Doof.addRegions({ region: '.doof' })

    Doof.on("before:start", function () {
        // find token here. Going to be done later.
        // $.ajax({
        //     method: 'POST',
        //     url: window.getkey,
        //     data: { secret: "967d2b1f6111a198431532149879983a1ad3501224fb0dbf947499b1" },
        //     dataType: 'json',
        //     complete: function (response) {
        //         if (response.success) {
        //             Doof.SECRET_TOKEN_KEY = response.result;
        //         }
        //     }
        // });

        //check for facebook asyncly. We will update application when we get the response.
        Doof.user = new User();
    });

    Doof.on("start", function () {

        new Router({ region: Doof.region, user: Doof.user });
        if (Backbone.history) {
            Backbone.history.start();
        }
    });

    return Doof;
});