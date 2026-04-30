const axios = require("axios");
const https = require("https");

const client = axios.create({
  baseURL: process.env.PROXMOX_URL,
  headers: {
    Authorization: `PVEAPIToken=${process.env.PROXMOX_TOKEN}`
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

async function getNodes() {
  const res = await client.get("/api2/json/nodes");
  return res.data.data;
}

async function getVMs(node) {
  const res = await client.get(`/api2/json/nodes/${node}/qemu`);
  return res.data.data;
}

async function getCTs(node) {
  const res = await client.get(`/api2/json/nodes/${node}/lxc`);
  return res.data.data;
}

module.exports = { getNodes, getVMs, getCTs };