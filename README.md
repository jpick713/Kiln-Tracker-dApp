### EPA mock Simulator

<a href="http://www.youtube.com/watch?feature=player_embedded&v=qqDtAz8z9Xo
" target="_blank"><img src="http://img.youtube.com/vi/qqDtAz8z9Xo/0.jpg" 
alt="" width="240" height="180" border="10" /></a>

In the project directory, you can open two command windows:

For server run 
`node server.js`

for client command line
run `truffle migrate --reset` any time you hack the solidity contracts

initial run do

1. `truffle develop`
2. `compile`
3. `migrate --reset` for local deployment
4. `npm run start`

**Simulator uses openSSL, if it has trouble running the simulator then go to the pebble-simulator iotex github repository**

[pebble-simulator home](https://github.com/iotexproject/pebble-simulator)

This is the raw simulator and you can hack the values for timestamp and gasResistance to be whatever you like after you import the simulator script, but if you would like to try exactly as in the video use the after-submit-improvements branch. It has the simulator set up exactly as in the video!

### `npm start`

Runs the app in the development mode.
the server is on `port 5000`.

This should open automatically, but if not
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

Notes on using ganache (or other networks)

The two contracts are large and you will have to use the chain settings to adjust gas limit upwards!
On the standard gas limit, you risk one or both of the compiles failing!
