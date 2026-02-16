export const epccSearchEnvData = epccSearchEnv();

function epccSearchEnv(): { enabled: boolean } {
  const enabled =
    process.env.NEXT_PUBLIC_ENABLE_EPCC_SEARCH !== "false";
  return { enabled };
}
