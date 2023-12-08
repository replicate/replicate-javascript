/*
 * A reference to a model version in the format `owner/name` or `owner/name:version`.
 */
class ModelVersionIdentifier {
  /*
   * @param {string} Required. The model owner.
   * @param {string} Required. The model name.
   * @param {string} The model version.
   */
  constructor(owner, name, version = null) {
    this.owner = owner;
    this.name = name;
    this.version = version;
  }

  /*
   * Parse a reference to a model version
   *
   * @param {string}
   * @returns {ModelVersionIdentifier}
   * @throws {Error} If the reference is invalid.
   */
  static parse(ref) {
    const match = ref.match(
      /^(?<owner>[^/]+)\/(?<name>[^/:]+)(:(?<version>.+))?$/
    );
    if (!match) {
      throw new Error(
        `Invalid reference to model version: ${ref}. Expected format: owner/name or owner/name:version`
      );
    }

    const { owner, name, version } = match.groups;

    return new ModelVersionIdentifier(owner, name, version);
  }
}

module.exports = ModelVersionIdentifier;
