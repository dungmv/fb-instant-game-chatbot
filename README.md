# fb-instant-game-chatbot

# API

## authentication

**Header** : `{secret-key: env.SECRET_KEY}`

## push message to all users

**URL** : `/api/push/{game-id}`

**Method** : `POST`

**Body** : 
```json
{
    "title": "Hello guy",
    "mssage": "Let's play with me!!!",
    "image": "https://i.imgur.com/ekduGmd.jpg",
    "button_title": "Play Now",
    "button_payload": "{}"
}
```

## get the results of the messaging process

**URL** : `/api/push/{game-id}?id=xxx`

**Method** : `GET`

**Param** : `id`

**Response** : 
```json
{
    "_id": "5f6879441d74150ca42ad922",
    "msg": "sending",
    "running": 1,
    "completed": 0,
    "total": 456,
    "success": 0,
    "error": 0,
    "created_at": "2020-09-21T09:58:28.993Z"
}
```
# webhook

## verify

**URL** : `/webhook/{game-id}`

**Method** : `GET`

## webhook

**URL** : `/webhook/{game-id}`

**Method** : `POST`
