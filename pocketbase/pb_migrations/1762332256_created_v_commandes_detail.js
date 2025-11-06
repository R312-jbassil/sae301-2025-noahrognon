/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation1689669068",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "userId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_ZcvW",
        "max": 255,
        "min": 0,
        "name": "userName",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_340737475",
        "hidden": false,
        "id": "relation4129913273",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "lunetteId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "_clone_WcY2",
        "max": null,
        "min": null,
        "name": "prixLunette",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "_clone_UHIs",
        "max": null,
        "min": null,
        "name": "totalDeclare",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "json3388699030",
        "maxSize": 1,
        "name": "totalCalcule",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "_clone_1PWc",
        "name": "createdAt",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "_clone_xa1q",
        "name": "updatedAt",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_4142713334",
    "indexes": [],
    "listRule": null,
    "name": "v_commandes_detail",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT\n  c.\"id\"                                 AS id,                 -- id de la commande\n  u.\"id\"                                 AS userId,\n  u.\"name\"                               AS userName,\n  l.\"id\"                                 AS lunetteId,\n  l.\"prix_final\"                         AS prixLunette,\n  c.\"total\"                              AS totalDeclare,\n  (COALESCE(l.\"prix_final\", 0))          AS totalCalcule,\n  c.\"created\"                            AS createdAt,\n  c.\"updated\"                            AS updatedAt\nFROM \"Commande\" AS c\nLEFT JOIN \"users\"   AS u ON c.\"IdUtilisateur\" = u.\"id\"\nLEFT JOIN \"lunette\" AS l ON c.\"Idlunette\"     = l.\"id\";\n",
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4142713334");

  return app.delete(collection);
})
