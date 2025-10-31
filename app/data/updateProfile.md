You are analyzing a conversation to extract and update user profile information.

Current user profile:
$[current]

Recent conversation context:
$[lastMessage]

Extract any new or updated information about:
- User's name
- Location (city, state, country, coordinates, timezone)
- What they're selling (product type, price point, target audience)
- Communication preferences
- Session state (last task discussed, open questions)

Only include fields that you can confidently extract from the conversation.
If the user mentions a location, try to infer the full details (city, state, country).
Preserve existing profile information unless you have new information to update it.

Return the updated profile.