var publisher = require('../models/publisher');
var Book = require('../models/book');
var async = require('async');

const { body,validationResult } = require("express-validator");

// Display list of all publisher.
exports.publisher_list = function(req, res, next) {

  publisher.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_publishers) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('publisher_list', { title: 'publisher List', list_publishers:  list_publishers});
    });

};

// Display detail page for a specific publisher.
exports.publisher_detail = function(req, res, next) {

    async.parallel({
        publisher: function(callback) {

            publisher.findById(req.params.id)
              .exec(callback);
        },

        publisher_books: function(callback) {
          Book.find({ 'publisher': req.params.id })
          .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.publisher==null) { // No results.
            var err = new Error('publisher not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('publisher_detail', { title: 'publisher Detail', publisher: results.publisher, publisher_books: results.publisher_books } );
    });

};

// Display publisher create form on GET.
exports.publisher_create_get = function(req, res, next) {
    res.render('publisher_form', { title: 'Create publisher'});
};

// Handle publisher create on POST.
exports.publisher_create_post = [

    // Validate and santise the name field.
    body('name', 'publisher name must contain at least 3 characters').trim().isLength({ min: 3 }).escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a publisher object with escaped and trimmed data.
        var publisher = new publisher(
          { name: req.body.name }
        );


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('publisher_form', { title: 'Create publisher', publisher: publisher, errors: errors.array()});
        return;
        }
        else {
            // Data from form is valid.
            // Check if publisher with same name already exists.
            publisher.findOne({ 'name': req.body.name })
                .exec( function(err, found_publisher) {
                     if (err) { return next(err); }

                     if (found_publisher) {
                         // publisher exists, redirect to its detail page.
                         res.redirect(found_publisher.url);
                     }
                     else {

                         publisher.save(function (err) {
                           if (err) { return next(err); }
                           // publisher saved. Redirect to publisher detail page.
                           res.redirect(publisher.url);
                         });

                     }

                 });
        }
    }
];

// Display publisher delete form on GET.
exports.publisher_delete_get = function(req, res, next) {

    async.parallel({
        publisher: function(callback) {
            publisher.findById(req.params.id).exec(callback);
        },
        publisher_books: function(callback) {
            Book.find({ 'publisher': req.params.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.publisher==null) { // No results.
            res.redirect('/catalog/publishers');
        }
        // Successful, so render.
        res.render('publisher_delete', { title: 'Delete publisher', publisher: results.publisher, publisher_books: results.publisher_books } );
    });

};

// Handle publisher delete on POST.
exports.publisher_delete_post = function(req, res, next) {

    async.parallel({
        publisher: function(callback) {
            publisher.findById(req.params.id).exec(callback);
        },
        publisher_books: function(callback) {
            Book.find({ 'publisher': req.params.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.publisher_books.length > 0) {
            // publisher has books. Render in same way as for GET route.
            res.render('publisher_delete', { title: 'Delete publisher', publisher: results.publisher, publisher_books: results.publisher_books } );
            return;
        }
        else {
            // publisher has no books. Delete object and redirect to the list of publishers.
            publisher.findByIdAndRemove(req.body.id, function deletepublisher(err) {
                if (err) { return next(err); }
                // Success - go to publishers list.
                res.redirect('/catalog/publishers');
            });

        }
    });

};

// Display publisher update form on GET.
exports.publisher_update_get = function(req, res, next) {

    publisher.findById(req.params.id, function(err, publisher) {
        if (err) { return next(err); }
        if (publisher==null) { // No results.
            var err = new Error('publisher not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('publisher_form', { title: 'Update publisher', publisher: publisher });
    });

};

// Handle publisher update on POST.
exports.publisher_update_post = [
   
    // Validate and sanitze the name field.
    body('name', 'publisher name must contain at least 3 characters').trim().isLength({ min: 3 }).escape(),
    

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request .
        const errors = validationResult(req);

    // Create a publisher object with escaped and trimmed data (and the old id!)
        var publisher = new publisher(
          {
          name: req.body.name,
          _id: req.params.id
          }
        );


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('publisher_form', { title: 'Update publisher', publisher: publisher, errors: errors.array()});
        return;
        }
        else {
            // Data from form is valid. Update the record.
            publisher.findByIdAndUpdate(req.params.id, publisher, {}, function (err,thepublisher) {
                if (err) { return next(err); }
                   // Successful - redirect to publisher detail page.
                   res.redirect(thepublisher.url);
                });
        }
    }
];
