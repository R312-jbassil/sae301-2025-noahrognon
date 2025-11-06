/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_340737475")

  // remove field
  collection.fields.removeById("select3682605528")

  // remove field
  collection.fields.removeById("select543225894")

  // remove field
  collection.fields.removeById("select2659947913")

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3682605528",
    "max": 0,
    "min": 0,
    "name": "couleur_verre",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text543225894",
    "max": 0,
    "min": 0,
    "name": "finition",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2659947913",
    "max": 0,
    "min": 0,
    "name": "position_gravure",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_340737475")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select3682605528",
    "maxSelect": 1,
    "name": "couleur_verre",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "#rtrberbrt",
      "#fvetbertb"
    ]
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select543225894",
    "maxSelect": 1,
    "name": "finition",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "brillant"
    ]
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select2659947913",
    "maxSelect": 1,
    "name": "position_gravure",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Branche droite",
      "Branche gauche"
    ]
  }))

  // remove field
  collection.fields.removeById("text3682605528")

  // remove field
  collection.fields.removeById("text543225894")

  // remove field
  collection.fields.removeById("text2659947913")

  return app.save(collection)
})
