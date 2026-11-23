import net from "node:net";

/** True only for globally routable addresses. Blocks loopback, private, link-local, CGNAT, metadata, multicast. */
export function isPublicIp(address: string): boolean {
  const v = net.isIP(address);
  if (v === 4) return isPublicV4(address);
  if (v === 6) return isPublicV6(address.toLowerCase());
  return false;
}

function isPublicV4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  if (a === 169 && b === 254) return false; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a >= 224) return false; // multicast + reserved
  return true;
}

function isPublicV6(ip: string) {
  if (ip === "::" || ip === "::1") return false;
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPublicV4(mapped[1]);
  const mappedHex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    return isPublicV4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  if (/^f[cd]/.test(ip)) return false; // unique local
  if (/^fe[89ab]/.test(ip)) return false; // link-local
  if (ip.startsWith("ff")) return false; // multicast
  if (ip.startsWith("64:ff9b:")) return false; // NAT64
  return true;
}
