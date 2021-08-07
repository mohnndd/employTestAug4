FROM node:12

WORKDIR C:\Users\mohnn\OneDrive\Desktop\project\employTestAug4\docker

COPY package*.json ./

RUN npm install 

COPY . .

EXPOSE 8080

CMD [ "npm", "app.js" ]
