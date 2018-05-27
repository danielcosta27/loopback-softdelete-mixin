'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends6 = require('babel-runtime/helpers/extends');

var _extends7 = _interopRequireDefault(_extends6);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _debug2 = require('./debug');

var _debug3 = _interopRequireDefault(_debug2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)();

exports.default = function (Model, _ref) {
  var _ref$deletedAt = _ref.deletedAt,
      deletedAt = _ref$deletedAt === undefined ? 'deletedAt' : _ref$deletedAt,
      _ref$_isDeleted = _ref._isDeleted,
      _isDeleted = _ref$_isDeleted === undefined ? '_isDeleted' : _ref$_isDeleted,
      _ref$scrub = _ref.scrub,
      scrub = _ref$scrub === undefined ? false : _ref$scrub,
      _ref$required = _ref.required,
      required = _ref$required === undefined ? false : _ref$required;

  debug('SoftDelete mixin for Model %s', Model.modelName);

  debug('options', { deletedAt: deletedAt, _isDeleted: _isDeleted, scrub: scrub, required: required });

  var properties = Model.definition.properties;

  var scrubbed = {};
  if (scrub !== false) {
    var propertiesToScrub = scrub;
    if (!Array.isArray(propertiesToScrub)) {
      propertiesToScrub = (0, _keys2.default)(properties).filter(function (prop) {
        return !properties[prop].id && prop !== _isDeleted;
      });
    }
    scrubbed = propertiesToScrub.reduce(function (obj, prop) {
      return (0, _extends7.default)({}, obj, (0, _defineProperty3.default)({}, prop, null));
    }, {});
  }

  Model.defineProperty(deletedAt, { type: Date, required: false });
  Model.defineProperty(_isDeleted, { type: Boolean, required: required, default: false });

  Model.destroyAll = function softDestroyAll(where, cb) {
    var _extends3;

    return Model.updateAll(where, (0, _extends7.default)({}, scrubbed, (_extends3 = {}, (0, _defineProperty3.default)(_extends3, deletedAt, new Date()), (0, _defineProperty3.default)(_extends3, _isDeleted, true), _extends3))).then(function (result) {
      return typeof cb === 'function' ? cb(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? cb(error) : _promise2.default.reject(error);
    });
  };

  Model.remove = Model.destroyAll;
  Model.deleteAll = Model.destroyAll;

  Model.destroyById = function softDestroyById(id, cb) {
    var _extends4;

    return Model.updateAll({ id: id }, (0, _extends7.default)({}, scrubbed, (_extends4 = {}, (0, _defineProperty3.default)(_extends4, deletedAt, new Date()), (0, _defineProperty3.default)(_extends4, _isDeleted, true), _extends4))).then(function (result) {
      return typeof cb === 'function' ? cb(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? cb(error) : _promise2.default.reject(error);
    });
  };

  Model.removeById = Model.destroyById;
  Model.deleteById = Model.destroyById;

  Model.prototype.destroy = function softDestroy(options, cb) {
    var _extends5;

    var callback = cb === undefined && typeof options === 'function' ? options : cb;

    return this.updateAttributes((0, _extends7.default)({}, scrubbed, (_extends5 = {}, (0, _defineProperty3.default)(_extends5, deletedAt, new Date()), (0, _defineProperty3.default)(_extends5, _isDeleted, true), _extends5))).then(function (result) {
      return typeof cb === 'function' ? callback(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? callback(error) : _promise2.default.reject(error);
    });
  };

  Model.prototype.remove = Model.prototype.destroy;
  Model.prototype.delete = Model.prototype.destroy;

  // Emulate default scope but with more flexibility.
  var queryNonDeleted = { _isDeleted: false };

  var _findOrCreate = Model.findOrCreate;
  Model.findOrCreate = function findOrCreateDeleted() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!query.deleted) {
      if (!query.where) {
        query.where = queryNonDeleted;
      } else {
        query.where = { and: [query.where, queryNonDeleted] };
      }
    }

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    return _findOrCreate.call.apply(_findOrCreate, [Model, query].concat(rest));
  };

  var _find = Model.find;
  Model.find = function findDeleted() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!query.deleted) {
      if (!query.where) {
        query.where = queryNonDeleted;
      } else {
        query.where = { and: [query.where, queryNonDeleted] };
      }
    }

    for (var _len2 = arguments.length, rest = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      rest[_key2 - 1] = arguments[_key2];
    }

    return _find.call.apply(_find, [Model, query].concat(rest));
  };

  var _count = Model.count;
  Model.count = function countDeleted() {
    var where = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // Because count only receives a 'where', there's nowhere to ask for the deleted entities.
    var whereNotDeleted = { and: [where, queryNonDeleted] };

    for (var _len3 = arguments.length, rest = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      rest[_key3 - 1] = arguments[_key3];
    }

    return _count.call.apply(_count, [Model, whereNotDeleted].concat(rest));
  };

  var _update = Model.update;
  Model.update = Model.updateAll = function updateDeleted() {
    var where = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // Because update/updateAll only receives a 'where', there's nowhere to ask for the deleted entities.
    var whereNotDeleted = { and: [where, queryNonDeleted] };

    for (var _len4 = arguments.length, rest = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      rest[_key4 - 1] = arguments[_key4];
    }

    return _update.call.apply(_update, [Model, whereNotDeleted].concat(rest));
  };
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNvZnQtZGVsZXRlLmpzIl0sIm5hbWVzIjpbImRlYnVnIiwiTW9kZWwiLCJkZWxldGVkQXQiLCJfaXNEZWxldGVkIiwic2NydWIiLCJyZXF1aXJlZCIsIm1vZGVsTmFtZSIsInByb3BlcnRpZXMiLCJkZWZpbml0aW9uIiwic2NydWJiZWQiLCJwcm9wZXJ0aWVzVG9TY3J1YiIsIkFycmF5IiwiaXNBcnJheSIsImZpbHRlciIsInByb3AiLCJpZCIsInJlZHVjZSIsIm9iaiIsImRlZmluZVByb3BlcnR5IiwidHlwZSIsIkRhdGUiLCJCb29sZWFuIiwiZGVmYXVsdCIsImRlc3Ryb3lBbGwiLCJzb2Z0RGVzdHJveUFsbCIsIndoZXJlIiwiY2IiLCJ1cGRhdGVBbGwiLCJ0aGVuIiwicmVzdWx0IiwiY2F0Y2giLCJlcnJvciIsInJlamVjdCIsInJlbW92ZSIsImRlbGV0ZUFsbCIsImRlc3Ryb3lCeUlkIiwic29mdERlc3Ryb3lCeUlkIiwicmVtb3ZlQnlJZCIsImRlbGV0ZUJ5SWQiLCJwcm90b3R5cGUiLCJkZXN0cm95Iiwic29mdERlc3Ryb3kiLCJvcHRpb25zIiwiY2FsbGJhY2siLCJ1bmRlZmluZWQiLCJ1cGRhdGVBdHRyaWJ1dGVzIiwiZGVsZXRlIiwicXVlcnlOb25EZWxldGVkIiwiX2ZpbmRPckNyZWF0ZSIsImZpbmRPckNyZWF0ZSIsImZpbmRPckNyZWF0ZURlbGV0ZWQiLCJxdWVyeSIsImRlbGV0ZWQiLCJhbmQiLCJyZXN0IiwiY2FsbCIsIl9maW5kIiwiZmluZCIsImZpbmREZWxldGVkIiwiX2NvdW50IiwiY291bnQiLCJjb3VudERlbGV0ZWQiLCJ3aGVyZU5vdERlbGV0ZWQiLCJfdXBkYXRlIiwidXBkYXRlIiwidXBkYXRlRGVsZXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7QUFDQSxJQUFNQSxRQUFRLHNCQUFkOztrQkFFZSxVQUFDQyxLQUFELFFBQW9HO0FBQUEsNEJBQTFGQyxTQUEwRjtBQUFBLE1BQTFG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VCxLQUFLLENBQUU1QixLQUFGLEVBQVNzQixlQUFULENBQVAsRUFBeEI7O0FBRnVELHVDQUFOTyxJQUFNO0FBQU5BLFVBQU07QUFBQTs7QUFHdkQsV0FBT0ssT0FBT0osSUFBUCxnQkFBWXRELEtBQVosRUFBbUI2RCxlQUFuQixTQUF1Q1IsSUFBdkMsRUFBUDtBQUNELEdBSkQ7O0FBTUEsTUFBTVMsVUFBVTlELE1BQU0rRCxNQUF0QjtBQUNBL0QsUUFBTStELE1BQU4sR0FBZS9ELE1BQU0wQixTQUFOLEdBQWtCLFNBQVNzQyxhQUFULEdBQTRDO0FBQUEsUUFBckJ4QyxLQUFxQix1RUFBYixFQUFhOztBQUMzRTtBQUNBLFFBQU1xQyxrQkFBa0IsRUFBRVQsS0FBSyxDQUFFNUIsS0FBRixFQUFTc0IsZUFBVCxDQUFQLEVBQXhCOztBQUYyRSx1Q0FBTk8sSUFBTTtBQUFOQSxVQUFNO0FBQUE7O0FBRzNFLFdBQU9TLFFBQVFSLElBQVIsaUJBQWF0RCxLQUFiLEVBQW9CNkQsZUFBcEIsU0FBd0NSLElBQXhDLEVBQVA7QUFDRCxHQUpEO0FBS0QsQyIsImZpbGUiOiJzb2Z0LWRlbGV0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfZGVidWcgZnJvbSAnLi9kZWJ1Zyc7XG5jb25zdCBkZWJ1ZyA9IF9kZWJ1ZygpO1xuXG5leHBvcnQgZGVmYXVsdCAoTW9kZWwsIHsgZGVsZXRlZEF0ID0gJ2RlbGV0ZWRBdCcsIF9pc0RlbGV0ZWQgPSAnX2lzRGVsZXRlZCcsIHNjcnViID0gZmFsc2UsIHJlcXVpcmVkID0gZmFsc2UgfSkgPT4ge1xuICBkZWJ1ZygnU29mdERlbGV0ZSBtaXhpbiBmb3IgTW9kZWwgJXMnLCBNb2RlbC5tb2RlbE5hbWUpO1xuXG4gIGRlYnVnKCdvcHRpb25zJywgeyBkZWxldGVkQXQsIF9pc0RlbGV0ZWQsIHNjcnViLCByZXF1aXJlZCB9KTtcblxuICBjb25zdCBwcm9wZXJ0aWVzID0gTW9kZWwuZGVmaW5pdGlvbi5wcm9wZXJ0aWVzO1xuXG4gIGxldCBzY3J1YmJlZCA9IHt9O1xuICBpZiAoc2NydWIgIT09IGZhbHNlKSB7XG4gICAgbGV0IHByb3BlcnRpZXNUb1NjcnViID0gc2NydWI7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHByb3BlcnRpZXNUb1NjcnViKSkge1xuICAgICAgcHJvcGVydGllc1RvU2NydWIgPSBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKVxuICAgICAgICAuZmlsdGVyKHByb3AgPT4gIXByb3BlcnRpZXNbcHJvcF0uaWQgJiYgcHJvcCAhPT0gX2lzRGVsZXRlZCk7XG4gICAgfVxuICAgIHNjcnViYmVkID0gcHJvcGVydGllc1RvU2NydWIucmVkdWNlKChvYmosIHByb3ApID0+ICh7IC4uLm9iaiwgW3Byb3BdOiBudWxsIH0pLCB7fSk7XG4gIH1cblxuICBNb2RlbC5kZWZpbmVQcm9wZXJ0eShkZWxldGVkQXQsIHt0eXBlOiBEYXRlLCByZXF1aXJlZDogZmFsc2V9KTtcbiAgTW9kZWwuZGVmaW5lUHJvcGVydHkoX2lzRGVsZXRlZCwge3R5cGU6IEJvb2xlYW4sIHJlcXVpcmVkOiByZXF1aXJlZCwgZGVmYXVsdDogZmFsc2V9KTtcblxuICBNb2RlbC5kZXN0cm95QWxsID0gZnVuY3Rpb24gc29mdERlc3Ryb3lBbGwod2hlcmUsIGNiKSB7XG4gICAgcmV0dXJuIE1vZGVsLnVwZGF0ZUFsbCh3aGVyZSwgeyAuLi5zY3J1YmJlZCwgW2RlbGV0ZWRBdF06IG5ldyBEYXRlKCksIFtfaXNEZWxldGVkXTogdHJ1ZSB9KVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2IobnVsbCwgcmVzdWx0KSA6IHJlc3VsdClcbiAgICAgIC5jYXRjaChlcnJvciA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKGVycm9yKSA6IFByb21pc2UucmVqZWN0KGVycm9yKSk7XG4gIH07XG5cbiAgTW9kZWwucmVtb3ZlID0gTW9kZWwuZGVzdHJveUFsbDtcbiAgTW9kZWwuZGVsZXRlQWxsID0gTW9kZWwuZGVzdHJveUFsbDtcblxuICBNb2RlbC5kZXN0cm95QnlJZCA9IGZ1bmN0aW9uIHNvZnREZXN0cm95QnlJZChpZCwgY2IpIHtcbiAgICByZXR1cm4gTW9kZWwudXBkYXRlQWxsKHsgaWQ6IGlkIH0sIHsgLi4uc2NydWJiZWQsIFtkZWxldGVkQXRdOiBuZXcgRGF0ZSgpLCBbX2lzRGVsZXRlZF06IHRydWUgfSlcbiAgICAgIC50aGVuKHJlc3VsdCA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKG51bGwsIHJlc3VsdCkgOiByZXN1bHQpXG4gICAgICAuY2F0Y2goZXJyb3IgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYihlcnJvcikgOiBQcm9taXNlLnJlamVjdChlcnJvcikpO1xuICB9O1xuXG4gIE1vZGVsLnJlbW92ZUJ5SWQgPSBNb2RlbC5kZXN0cm95QnlJZDtcbiAgTW9kZWwuZGVsZXRlQnlJZCA9IE1vZGVsLmRlc3Ryb3lCeUlkO1xuXG4gIE1vZGVsLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gc29mdERlc3Ryb3kob3B0aW9ucywgY2IpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9IChjYiA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSA/IG9wdGlvbnMgOiBjYjtcblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZUF0dHJpYnV0ZXMoeyAuLi5zY3J1YmJlZCwgW2RlbGV0ZWRBdF06IG5ldyBEYXRlKCksIFtfaXNEZWxldGVkXTogdHJ1ZSB9KVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2FsbGJhY2sobnVsbCwgcmVzdWx0KSA6IHJlc3VsdClcbiAgICAgIC5jYXRjaChlcnJvciA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNhbGxiYWNrKGVycm9yKSA6IFByb21pc2UucmVqZWN0KGVycm9yKSk7XG4gIH07XG5cbiAgTW9kZWwucHJvdG90eXBlLnJlbW92ZSA9IE1vZGVsLnByb3RvdHlwZS5kZXN0cm95O1xuICBNb2RlbC5wcm90b3R5cGUuZGVsZXRlID0gTW9kZWwucHJvdG90eXBlLmRlc3Ryb3k7XG5cbiAgLy8gRW11bGF0ZSBkZWZhdWx0IHNjb3BlIGJ1dCB3aXRoIG1vcmUgZmxleGliaWxpdHkuXG4gIGNvbnN0IHF1ZXJ5Tm9uRGVsZXRlZCA9IHtfaXNEZWxldGVkOiBmYWxzZX07XG5cbiAgY29uc3QgX2ZpbmRPckNyZWF0ZSA9IE1vZGVsLmZpbmRPckNyZWF0ZTtcbiAgTW9kZWwuZmluZE9yQ3JlYXRlID0gZnVuY3Rpb24gZmluZE9yQ3JlYXRlRGVsZXRlZChxdWVyeSA9IHt9LCAuLi5yZXN0KSB7XG4gICAgaWYgKCFxdWVyeS5kZWxldGVkKSB7XG4gICAgICBpZiAoIXF1ZXJ5LndoZXJlKSB7XG4gICAgICAgIHF1ZXJ5LndoZXJlID0gcXVlcnlOb25EZWxldGVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVlcnkud2hlcmUgPSB7IGFuZDogWyBxdWVyeS53aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gX2ZpbmRPckNyZWF0ZS5jYWxsKE1vZGVsLCBxdWVyeSwgLi4ucmVzdCk7XG4gIH07XG5cbiAgY29uc3QgX2ZpbmQgPSBNb2RlbC5maW5kO1xuICBNb2RlbC5maW5kID0gZnVuY3Rpb24gZmluZERlbGV0ZWQocXVlcnkgPSB7fSwgLi4ucmVzdCkge1xuICAgIGlmICghcXVlcnkuZGVsZXRlZCkge1xuICAgICAgaWYgKCFxdWVyeS53aGVyZSkge1xuICAgICAgICBxdWVyeS53aGVyZSA9IHF1ZXJ5Tm9uRGVsZXRlZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXJ5LndoZXJlID0geyBhbmQ6IFsgcXVlcnkud2hlcmUsIHF1ZXJ5Tm9uRGVsZXRlZCBdIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIF9maW5kLmNhbGwoTW9kZWwsIHF1ZXJ5LCAuLi5yZXN0KTtcbiAgfTtcblxuICBjb25zdCBfY291bnQgPSBNb2RlbC5jb3VudDtcbiAgTW9kZWwuY291bnQgPSBmdW5jdGlvbiBjb3VudERlbGV0ZWQod2hlcmUgPSB7fSwgLi4ucmVzdCkge1xuICAgIC8vIEJlY2F1c2UgY291bnQgb25seSByZWNlaXZlcyBhICd3aGVyZScsIHRoZXJlJ3Mgbm93aGVyZSB0byBhc2sgZm9yIHRoZSBkZWxldGVkIGVudGl0aWVzLlxuICAgIGNvbnN0IHdoZXJlTm90RGVsZXRlZCA9IHsgYW5kOiBbIHdoZXJlLCBxdWVyeU5vbkRlbGV0ZWQgXSB9O1xuICAgIHJldHVybiBfY291bnQuY2FsbChNb2RlbCwgd2hlcmVOb3REZWxldGVkLCAuLi5yZXN0KTtcbiAgfTtcblxuICBjb25zdCBfdXBkYXRlID0gTW9kZWwudXBkYXRlO1xuICBNb2RlbC51cGRhdGUgPSBNb2RlbC51cGRhdGVBbGwgPSBmdW5jdGlvbiB1cGRhdGVEZWxldGVkKHdoZXJlID0ge30sIC4uLnJlc3QpIHtcbiAgICAvLyBCZWNhdXNlIHVwZGF0ZS91cGRhdGVBbGwgb25seSByZWNlaXZlcyBhICd3aGVyZScsIHRoZXJlJ3Mgbm93aGVyZSB0byBhc2sgZm9yIHRoZSBkZWxldGVkIGVudGl0aWVzLlxuICAgIGNvbnN0IHdoZXJlTm90RGVsZXRlZCA9IHsgYW5kOiBbIHdoZXJlLCBxdWVyeU5vbkRlbGV0ZWQgXSB9O1xuICAgIHJldHVybiBfdXBkYXRlLmNhbGwoTW9kZWwsIHdoZXJlTm90RGVsZXRlZCwgLi4ucmVzdCk7XG4gIH07XG59O1xuIl19
