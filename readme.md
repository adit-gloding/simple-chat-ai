# Simple Chat AI

A powerful chat application that integrates with OpenAI's Assistant API to create and manage AI agents for intelligent conversations. This project provides a robust backend for managing AI assistants, conversations, and document search capabilities.

## Features

- **AI Agent Management**
  - Create custom AI assistants with specific instructions
  - Configure assistant parameters (model, tools, temperature, etc.)
  - Manage agent metadata and configurations
  - Vector store integration for document search capabilities

- **Conversation Management**
  - Create and manage conversation threads
  - Real-time message exchange with AI assistants
  - Message history retrieval
  - Automatic citation removal from responses

- **Advanced Features**
  - Document search using vector stores
  - Configurable response formats (text, JSON)
  - Sanitized inputs for security
  - Comprehensive error handling

## Prerequisites

- Node.js (v14 or higher)
- MySQL database
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/simple-chat-ai.git
cd simple-chat-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
OPENAI_API_KEY=your_openai_api_key
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

4. Set up the database:
- Create a MySQL database
- Run the database migrations (if provided)

sample tables:

agents:
id: INT/BIGINT PK
assistant_id: INT
vector_store_id: INT
name: VARCHAR(50)
instructions: TEXT
created_at: datetime
updated_at: datetime

conversations:
id: INT/BIGINT PK
agent_id: INT/BIGINT FK
thread_id: VARCHAR(50)
created_at: datetime
updated_at: datetime

## Usage

### Starting the Server
```bash
npm start
```

### API Endpoints

#### Agents

1. Create a new agent:
```http
POST /api/agents
Content-Type: application/json

{
  "name": "My Assistant",
  "instructions": "You are a helpful assistant..."
}
```

2. Get all agents:
```http
GET /api/agents
```

3. Get agent by ID:
```http
GET /api/agents/:id
```

4. Update agent:
```http
PUT /api/agents/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "instructions": "Updated instructions..."
}
```

5. Delete agent:
```http
DELETE /api/agents/:id
```

#### Conversations

1. Get or create conversation for an agent:
```http
GET /api/conversations/agent/:id
```

2. Get message history:
```http
GET /api/conversations/thread/:id
```

3. Send message to agent:
```http
POST /api/conversations/send
Content-Type: application/json

{
  "agent_id": "123",
  "thread_id": "thread_xyz",
  "message": "Hello, assistant!"
}
```

## Configuration

### OpenAI Assistant Configuration

The project supports various OpenAI assistant configurations:

```javascript
{
  name: "Assistant Name",
  instructions: "Assistant instructions...",
  model: "gpt-4o",
  tools: [{ "type": "file_search" }],
  tool_resources: { 
    "file_search": { 
      "vector_store_ids": ["vector_store_id"] 
    } 
  },
  temperature: 1,  // 0.0 to 1.0
  response_format: { type: "text" }  // or "json_object", "json_schema"
}
```

### Security Features

- Input sanitization for agent names and instructions
- Secure database operations
- Error logging and handling
- API key protection

## Error Handling

The application includes comprehensive error handling:
- Input validation
- Database operation errors
- OpenAI API errors
- Network and connection issues

## Development

### Project Structure

```
src/
├── controllers/
│   ├── agentController.js    # Agent management
│   └── conversationController.js  # Conversation handling
├── models/
│   └── agent.js              # Database models
├── services/
│   ├── openaiService.js      # OpenAI integration
│   └── logError.js           # Error logging
├── utils/
│   ├── response.js           # Response formatting
│   ├── validation.js         # Input validation
│   └── textFormat.js         # Text processing
└── configs/
    ├── db.js                 # Database configuration
    └── constants.js          # Application constants
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[MIT License](LICENSE)

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
