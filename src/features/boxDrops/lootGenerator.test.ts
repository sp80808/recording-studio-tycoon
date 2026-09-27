import { generateBoxLoot } from './lootGenerator'

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('ASSERT FAIL:', msg)
    process.exitCode = 2
  }
}

function run() {
  console.log('Running lootGenerator tests...')
  const items = generateBoxLoot('1960s', 3, 12345)
  console.log('Generated items:', items.map(i => i.name))
  assert(items.length === 3, 'should generate requested count')
  // deterministic-ish: repeated seeded calls should produce similar rarities
  const items2 = generateBoxLoot('1960s', 3, 12345)
  assert(items[0].name === items2[0].name, 'seeded generation should be deterministic')
  console.log('All tests passed.')
}

if (require.main === module) run()
