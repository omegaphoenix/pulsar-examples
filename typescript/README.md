# pulsar-reader

Read off a pulsar topic

### Steps

### Setup
Linux
```bash
wget --user-agent=Mozilla -O apache-pulsar-client.deb "https://archive.apache.org/dist/pulsar/pulsar-2.6.0/DEB/apache-pulsar-client.deb"
wget --user-agent=Mozilla -O apache-pulsar-client-dev.deb "https://archive.apache.org/dist/pulsar/pulsar-2.6.0/DEB/apache-pulsar-client-dev.deb"
sudo apt install -y ./apache-pulsar-client*.deb

npm install
npm run build

cp config.sample.toml config.toml

# Fill in token and topic in the config.toml

npm run build && node lib/reader.js
```

### Rest API
```
curl 'https://{host}/admin/v2/namespaces/public/{namespace}' -X PUT -H 'Accept: application/json, text/plain, */*' --compressed -H 'Authorization: Bearer [token]'
```
