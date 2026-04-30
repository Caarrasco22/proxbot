const fs = require("fs");
const path = require("path");
const { getNodes, getVMs, getCTs } = require("../utils/proxmox");

async function sync() {
  try {
    const nodes = await getNodes();
    const result = [];

    for (const node of nodes) {
      const vms = await getVMs(node.node);
      const cts = await getCTs(node.node);

      result.push({
        node: node.node,
        vms: vms.map(vm => ({
          id: vm.vmid,
          name: vm.name,
          status: vm.status
        })),
        containers: cts.map(ct => ({
          id: ct.vmid,
          name: ct.name,
          status: ct.status
        }))
      });
    }

    const outputPath = path.join(__dirname, "..", "proxmox.json");

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    console.log("Proxmox sincronizado correctamente");
  } catch (error) {
    console.error("Error sincronizando Proxmox:", error.message);
  }
}

sync();