"use strict";
const mongoose = require("mongoose");

//Define a schema
const Schema = mongoose.Schema;

///SCHEMA FOR STRUCTURAL TEMPLATES

//
const templateSchema = new Schema({
  //name of this template
  label: { type: String, required: true, maxlength: 100 },
  //paths to properties in 'body' to be updated with given data as part of the algorithm
  add: {
    type: [
      {
        parameter: { type: String },
        fields: { type: [{ path: { type: String } }] },
        entryObject_property: { type: String },
        entryObject: { type: Schema.Types.Mixed },
      }
    ],
    required: true,
  },
  body: { type: Schema.Types.Mixed, required: true }
});

//
/*
const cdsServiceSchema = new Schema({ hook: {type: String, required: true},
title: {type: String, required: true},
description: {type: String, required: true},
id: {type: String, required: true},
prefetch: {type: Schema.Types.Mixed}});
*/


module.exports = { templateSchema };
