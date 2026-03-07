if (
  process.env.NODE_ENV === 'production' ||
  process.env.CI === 'true' ||
  process.env.VERCEL === '1'
) {
  process.exit(0);
}

try {
  const husky = (await import('husky')).default;
  husky();
} catch (error) {
  if (error?.code === 'ERR_MODULE_NOT_FOUND') {
    process.exit(0);
  }

  throw error;
}