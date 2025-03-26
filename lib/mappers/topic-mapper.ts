/**
 * Map a topic string to one of the certification exam categories
 * @param topic The raw topic string to map
 * @returns One of the certification exam categories
 */
export function mapToCloudinaryTopic(topic: string): string {
  // If empty or undefined, return default topic
  if (!topic) {
    return "Products, Value, Environment Settings, and Implementation Strategies";
  }

  // Clean up the topic
  const cleanTopic = topic.trim().toLowerCase();

  // Map to certification exam categories
  if (
    cleanTopic.includes("product") ||
    cleanTopic.includes("value") ||
    cleanTopic.includes("environment") ||
    cleanTopic.includes("implementation")
  )
    return "Products, Value, Environment Settings, and Implementation Strategies";

  if (cleanTopic.includes("system") || cleanTopic.includes("architecture"))
    return "System Architecture";

  if (
    cleanTopic.includes("lifecycle") ||
    cleanTopic.includes("emerging") ||
    cleanTopic.includes("trends")
  )
    return "Media Lifecycle Strategy and Emerging Trends";

  if (
    cleanTopic.includes("widget") ||
    cleanTopic.includes("add-on") ||
    cleanTopic.includes("add on") ||
    cleanTopic.includes("integration") ||
    cleanTopic.includes("plugin")
  )
    return "Widgets, Out of Box Add-ons, Custom Integrations";

  if (
    cleanTopic.includes("upload") ||
    cleanTopic.includes("migrate") ||
    cleanTopic.includes("migration")
  )
    return "Upload and Migrate Assets";

  if (cleanTopic.includes("transform")) return "Transformations";

  if (
    cleanTopic.includes("media management") ||
    cleanTopic.includes("management") ||
    cleanTopic.includes("folder") ||
    cleanTopic.includes("organize") ||
    cleanTopic.includes("tag") ||
    cleanTopic.includes("metadata")
  )
    return "Media Management";

  if (
    cleanTopic.includes("user") ||
    cleanTopic.includes("role") ||
    cleanTopic.includes("group") ||
    cleanTopic.includes("access") ||
    cleanTopic.includes("security") ||
    cleanTopic.includes("permission")
  )
    return "User, Role, and Group Management and Access Controls";

  // For backward compatibility with older topic names
  if (
    cleanTopic.includes("cloudinary basics") ||
    cleanTopic.includes("basics") ||
    cleanTopic === "cloudinary"
  )
    return "Products, Value, Environment Settings, and Implementation Strategies";

  if (cleanTopic.includes("image optimization")) return "Transformations";

  if (cleanTopic.includes("video processing") || cleanTopic.includes("video"))
    return "Media Management";

  if (cleanTopic.includes("asset management") || cleanTopic.includes("assets"))
    return "Media Management";

  if (cleanTopic.includes("upload api")) return "Upload and Migrate Assets";

  if (cleanTopic.includes("admin api"))
    return "User, Role, and Group Management and Access Controls";

  if (cleanTopic.includes("security features"))
    return "User, Role, and Group Management and Access Controls";

  if (
    cleanTopic.includes("performance optimization") ||
    cleanTopic.includes("cdn")
  )
    return "System Architecture";

  if (cleanTopic.includes("sdks") || cleanTopic.includes("sdk and"))
    return "Widgets, Out of Box Add-ons, Custom Integrations";

  // Default if no match found
  return "Products, Value, Environment Settings, and Implementation Strategies";
}
