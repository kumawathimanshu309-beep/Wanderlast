const Joi = require("joi");

const listingSchema = Joi.object({

    listing: Joi.object({

        title: Joi.string()
            .required(),

        description: Joi.string()
            .allow(""),

        price: Joi.number()
            .min(0)
            .required(),

        location: Joi.string()
            .required(),

        country: Joi.string()
            .required(),

        category: Joi.string()
            .valid(
                "Trending",
                "Rooms",
                "Iconic Cities",
                "Mountains",
                "Castles",
                "Amazing Pools",
                "Camping",
                "Farms",
                "Arctic"
            )
            .required(),

        image: Joi.object({
            url: Joi.string()
                .allow("")
        })
        .allow("")

    }).required()

});


module.exports = {
    listingSchema
};