import { verifyHyundaiTenantTargets } from '../server/utils/tenant-verification';

async function main() {
  try {
    const results = await verifyHyundaiTenantTargets();

    console.log('Hyundai tenant verification passed');
    for (const result of results) {
      console.log(
        [
          result.hostname,
          `tenant=${result.resolvedSlug}`,
          `name=${result.resolvedName}`,
          `source=${result.source}`,
          `config=${result.config.name}`,
          `nav=${result.config.hasNav ? 'yes' : 'no'}`,
          `promotional=${result.config.promotionalCount}`,
        ].join(' | ')
      );
    }
  } catch (error: any) {
    console.error('Hyundai tenant verification failed');
    console.error(error?.message || error);
    process.exit(1);
  }
}

main();
