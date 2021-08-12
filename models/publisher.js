var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PublisherSchema = new Schema({
  name: { type: String, required: true, minLenght: 10, maxLength: 60 },
});

// Virtual for thie Publisher's url:
PublisherSchema.virtual('url').get(function() {
  return '/catalog/author/' + this._id;
});

// Export model:
module.exports = mongoose.model('Publisher', PublisherSchema);