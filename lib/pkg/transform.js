export async function transform(info) {
  const {pkgData} = info
  const {name, private: priv} = pkgData || {}
  return {name, private: Boolean(!pkgData || !name || priv)}
}
