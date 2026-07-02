import { retrievePathshalaContext } from '../src/lib/ai/retrieval';

async function main() {
  const resEmbed = await retrievePathshalaContext({
    title: "valmiki ramayana bala kanda 1.1.1",
    corpus: "valmiki_ramayana"
  });
  console.log(JSON.stringify(resEmbed.map(d => ({id: d.id, chunkId: d.metadata?.chunkId, docId: d.metadata?.docId})), null, 2));
}
main();
