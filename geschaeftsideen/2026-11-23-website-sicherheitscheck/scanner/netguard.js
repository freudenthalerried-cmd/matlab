'use strict';
// Schutz gegen SSRF: Der Scanner darf nur öffentliche Adressen abrufen,
// niemals interne Netze (localhost, 10.x, Cloud-Metadaten 169.254.169.254 …).
const net = require('node:net');
const dns = require('node:dns');

const block = new net.BlockList();
[
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].forEach(([a, p]) => block.addSubnet(a, p, 'ipv4'));
[
  ['::', 127], ['64:ff9b::', 96], ['100::', 64], ['2001::', 32],
  ['2001:db8::', 32], ['2002::', 16], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
].forEach(([a, p]) => block.addSubnet(a, p, 'ipv6'));

function isPrivate(ip) {
  const type = net.isIP(ip);
  if (!type) return true;
  // IPv4-gemappte IPv6-Adressen (::ffff:a.b.c.d) immer blockieren
  if (type === 6 && /^::ffff:/i.test(ip)) return true;
  return block.check(ip, type === 4 ? 'ipv4' : 'ipv6');
}

function blockedError() {
  const e = new Error('BLOCKED_PRIVATE');
  e.code = 'BLOCKED_PRIVATE';
  return e;
}

// DNS-Lookup, der private Ziele verwirft. Wird direkt an http(s).request
// übergeben, damit die geprüfte IP auch die verbundene IP ist (kein DNS-Rebinding).
function makeLookup({ allowPrivate = false, lookup = dns.lookup } = {}) {
  return (hostname, options, cb) => {
    if (typeof options === 'function') { cb = options; options = {}; }
    lookup(hostname, { all: true, verbatim: true }, (err, addrs) => {
      if (err) return cb(err);
      const ok = addrs.filter((a) => allowPrivate || !isPrivate(a.address));
      if (!ok.length) return cb(blockedError());
      if (options && options.all) return cb(null, ok);
      cb(null, ok[0].address, ok[0].family);
    });
  };
}

module.exports = { isPrivate, makeLookup, blockedError };
