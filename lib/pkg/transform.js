export async function transform(info) {
  const {packageData} = info
  const {name, private: priv} = packageData || {}
  return {name, private: Boolean(!packageData || !name || priv)}
}
