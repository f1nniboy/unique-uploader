# 🖥 unique-uploader
[![forthebadge](https://forthebadge.com/images/badges/made-with-typescript.svg)](https://forthebadge.com)

> `unique-uploader` is a file uploader with authentication and a permission system.

## Prerequisites
`git` - https://git-scm.com/downloads

`node` and `npm` (v12.0.0 or later) - https://nodejs.org

## 🚀 Installation
```
git clone https://github.com/f1nniboy/unique-uploader
cd unique-uploader
npm install
```

### 🚀 Starting the website
To start the website, execute the following command:

`npm run start`

This will compile the TypeScript files into JavaScript files and then execute the program.

## ⚙️ Configuration
```json
{
    "logFormat": "{time} \u001b[37m|\u001b[39m {sender} \u001b[37m~\u001b[39m {message}",

    "mongoURI": "",
    "serverPort": 8080,
    "debugMode": false,

    "requestPath": "requests/"
}
```

Put your MongoDB connection URI into `mongoURI`.
