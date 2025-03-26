# User, Role, and Group Management and Access Controls

This quiz focuses on user management, role-based access control, and security strategies in Cloudinary.

## Instructions

- Single-choice questions: Select the ONE best answer
- Multi-select questions: Select UP TO 3 answers that apply
- Pay attention to code examples and implementation scenarios

---

## Questions

**1. What is the most secure approach to managing user access in a multi-tenant SaaS platform?**

A) Using a single global access policy
B) Implementing granular, role-based access controls  
C) Relying on default permission settings
D) Manual user management

**Difficulty:** Medium

**2. How would you programmatically create a new sub-account with specific access restrictions? (Code-based question)**

A)

```javascript
cloudinary.v2.provisioning.account
  .create_sub_account({
    name: "marketing",
    cloud_name: "parent_cloud_name",
  })
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.error(error);
  });
```

B)

```javascript
cloudinary.admin.create_sub_account({
  name: "marketing",
  cloud_name: "parent_cloud",
});
```

C)

```javascript
cloudinary.accounts.create({
  name: "marketing",
  restrictions: true,
});
```

D)

```javascript
cloudinary.provisioning.create_account({
  name: "marketing",
  enabled: true,
});
```

**Difficulty:** Hard

**3. For a global organization with complex access requirements, what user management strategy provides the most flexibility? (Select up to 3)**

A) Implementing role-based access control (RBAC)
B) Creating custom user groups
C) Using single global permissions
D) Developing granular permission sets
E) Manual access management

**Difficulty:** Hard

**4. How can you programmatically manage user permissions in Cloudinary? (Code-based question)**

A)

```javascript
cloudinary.v2.api.update_user("user_id", {
  role: "editor",
  custom_attributes: { permissions: ["upload", "edit"] },
});
```

B)

```javascript
cloudinary.users.modify("user_id", {
  role: "admin",
});
```

C)

```javascript
cloudinary.provisioning.update_user({
  user_id: "user_id",
  access_level: "restricted",
});
```

D)

```javascript
cloudinary.account.set_permissions("user_id", {
  can_upload: true,
});
```

**Difficulty:** Medium

**5. What approach ensures the most comprehensive security for sensitive media assets? (Select up to 3)**

A) Implementing multi-factor authentication
B) Using role-based access controls
C) Relying on default security settings
D) Creating dynamic access tokens
E) Manual permission management

**Difficulty:** Hard

**6. How would you programmatically list users in a Cloudinary sub-account? (Code-based question)**

A)

```javascript
cloudinary.admin.users({
  sub_account: "marketing",
});
```

B)

```javascript
cloudinary.v2.provisioning.account
  .sub_account_users("sub_account_id")
  .then((users) => {
    console.log(users);
  })
  .catch((error) => {
    console.error(error);
  });
```

C)

```javascript
cloudinary.account.list_users({
  cloud_name: "marketing",
});
```

D)

```javascript
cloudinary.users.list({
  filter: "sub_account",
});
```

**Difficulty:** Medium

**7. What is the most effective strategy for managing user access in a dynamic enterprise environment?**

A) Static role assignments
B) Dynamic role-based access with automated policy enforcement
C) Manual user management  
D) Using default access settings

**Difficulty:** Medium

**8. For a collaborative media platform, what user management approach provides the most granular control? (Select up to 3)**

A) Implementing hierarchical user roles
B) Creating custom permission sets
C) Using broad access categories
D) Developing context-specific access policies
E) Manual role assignment

**Difficulty:** Hard

**9. What method provides the most secure authentication for API integrations?**

A) Storing API credentials in code
B) Using short-lived, signed authentication tokens
C) Relying on static API keys
D) Manual token generation

**Difficulty:** Medium

**10. How can an organization ensure consistent access controls across multiple teams? (Select up to 3)**

A) Implementing centralized user management
B) Creating standardized role templates
C) Manual individual user configurations
D) Developing dynamic access policies
E) Using default group settings

**Difficulty:** Hard
