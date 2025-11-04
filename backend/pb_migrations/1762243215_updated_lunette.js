/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_340737475")

  // add field
  collection.fields.addAt(9, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1897857566",
    "hidden": false,
    "id": "relation520300358",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "Materiaux_monture",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1897857566",
    "hidden": false,
    "id": "relation1131496409",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "Materiaux_branche",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_340737475")

  // remove field
  collection.fields.removeById("relation520300358")

  // remove field
  collection.fields.removeById("relation1131496409")

  return app.save(collection)
})
