### EPA mock Simulator

https://www.youtube.com/watch?v=qqDtAz8z9Xo

<iframe width="560" height="315" src="https://www.youtube.com/embed/qqDtAz8z9Xo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

In the project directory, you can open two commond lines:

For server run 
`node server.js`

for client command line
run `truffle migrate --reset` any time you hack the solidity contracts

initial run do

1. `truffle develop`
2. `compile`
3. `migrate --reset` for local deployment
4. `npm run start`


### `npm start`

Runs the app in the development mode.
the server is on `port 5000`.

This should open automatically, but if not
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

Notes on using ganache (or other networks)

The two contracts are large and you will have to use the chain settings to adjust gas limit upwards!
On the standard gas limit, you risk one or both of the compiles failing!
