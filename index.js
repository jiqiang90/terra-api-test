const {range} = require("lodash");
const {LCDClient,hashToHex} = require("@terra-money/terra.js")

const api = new LCDClient({
    URL: "http://terra.dc.thechainhub.com:1317",
    chainID: 'columbus-5'
})

async function getBlockByHeight(api,height) {
    return api.tendermint.blockInfo(height).catch((e) => {
        console.log(`failed to fetch Block ${height}`);
        throw e;
    });
}

async function fetchBlocksArray(api,blockArray){
    const blocks = [];
    for (const blockHeight of blockArray){
        console.log(`+ fetch block ${blockHeight}`)
        const block = await getBlockByHeight(api, blockHeight);
        blocks.push(block);
    }
    return blocks;
}


async function getEventsByTypeFromBlock(
    api,
    blockInfo,
){
    const txHashes = blockInfo.block.data.txs;
    if (txHashes.length === 0) {
        return [];
    }
    const txInfos = await getTxInfobyHashes(api, txHashes);
    const txLogs = txInfos.map((txInfo) => txInfo.logs);
    const txLogsFlat = ([]).concat(...txLogs);
    const events = txLogsFlat.map((txLog) => txLog.eventsByType);
    return events;
}

async function getTxInfobyHashes(
    api,
    txHashes,
){
    const TxInfo = [];
    for (const hash of txHashes){
        const hex = hashToHex(hash)
        console.log(`- fetch transaction : ${hex}`)
        try{
            const info = await api.tx.txInfo(hex)
            TxInfo.push(info);
        }catch (e) {
            console.log(`!!! failed to fetch transaction ${hex}`);
            throw e;
        }
    }
    return TxInfo;
}


async function main(){
    const startTime= Date.now()
    console.log('1. start indexing blocks')
    const blocks = await fetchBlocksArray(api,range(4751185,4751195));
    console.log('2. start indexing transactions')
    for (const block of blocks){
       await getEventsByTypeFromBlock (api, block)
    }
    const endTime= Date.now()
    const totalTime = startTime - endTime;




    console.log(`total time ${totalTime}`)
    // await api.disconnect();
    process.exit(1)
}

main().catch(e=>process.exit(1));

