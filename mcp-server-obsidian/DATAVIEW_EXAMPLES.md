# Dataview & Canvas Integration Examples

## Dataview Query Examples

### Basic Queries

#### List All Notes with Specific Tag
```
User: "Show me all my meeting notes from this month"

AI Action: query_dataview
Query: "LIST FROM #meeting"
Result: Formatted list of all notes tagged with #meeting
```

#### Table View of Project Status
```
User: "Create a table showing all my projects with their status and due dates"

AI Action: query_dataview  
Query: "TABLE status, due-date FROM #project"
Result: Formatted table with project information
```

#### Task Management
```
User: "Show me all incomplete tasks across my vault"

AI Action: query_dataview
Query: "TASK FROM \"\""
Result: List of all tasks with completion status
```

### Advanced Dataview Workflows

#### Research Paper Tracking
```
Query: "TABLE author, year, citation-count FROM \"Literature\""
Result: Academic paper database with key metrics
```

#### Meeting Analytics
```
Query: "LIST FROM #meeting WHERE date >= date(2024-01-01)"
Result: Recent meetings for review and follow-up
```

#### Project Dashboard
```
Query: "TABLE status, priority, assigned FROM #project SORT priority DESC"
Result: Project overview sorted by priority
```

## Canvas Integration Examples

### Knowledge Mapping

#### Create Research Canvas
```
User: "Create a canvas for my AI research project with nodes for key papers"

AI Actions:
1. create_canvas_node - Add central "AI Research" text node
2. create_canvas_node - Add file nodes for each paper
3. connect_canvas_nodes - Link papers to main topic
```

#### Meeting Flow Visualization
```
User: "Map out our project workflow on a canvas"

AI Actions:
1. create_canvas_node - "Planning" phase
2. create_canvas_node - "Development" phase  
3. create_canvas_node - "Testing" phase
4. connect_canvas_nodes - Sequential workflow connections
```

### Brainstorming & Planning

#### Idea Development Canvas
```
Canvas Structure:
- Central idea node (text)
- Supporting research nodes (file links)
- Action item nodes (text)
- Connected with labeled relationships
```

#### Project Architecture
```
Canvas Layout:
- Component nodes (file references)
- Dependency connections (labeled edges)
- Documentation nodes (text/links)
- Visual project structure
```

## Real-World Use Cases

### Academic Research Workflow
1. **Literature Review**: Dataview table of papers by topic/year
2. **Note Connections**: Canvas showing paper relationships
3. **Progress Tracking**: Task queries for research milestones
4. **Thesis Structure**: Canvas outlining chapter flow

### Project Management
1. **Status Dashboard**: Dataview table of all projects
2. **Team Assignments**: Query tasks by assignee
3. **Workflow Visualization**: Canvas showing process flow
4. **Milestone Tracking**: Timeline canvas with deadlines

### Personal Knowledge Management
1. **Daily Review**: Dataview of recent notes and tasks
2. **Topic Exploration**: Canvas mapping concept relationships
3. **Learning Paths**: Connected canvas of study materials
4. **Reflection Analysis**: Query journal entries by mood/topic

## Dataview Query Syntax Supported

### Basic Formats
- `LIST FROM source` - Simple list of notes
- `TABLE field1, field2 FROM source` - Tabular data
- `TASK FROM source` - Task extraction and status

### Source Filters
- `#tag` - Notes with specific tag
- `"folder"` - Notes in specific folder
- `""` - All notes in vault

### Example Queries
```javascript
// All meeting notes as list
"LIST FROM #meeting"

// Project table with status
"TABLE status, due-date FROM #project" 

// All incomplete tasks
"TASK FROM \"\""

// Recent daily notes
"LIST FROM #daily WHERE date >= date(2024-01-01)"
```

## Canvas Node Types

### Text Nodes
- Free-form text content
- Ideas, notes, comments
- Markdown formatting supported

### File Nodes  
- Link to existing vault files
- Automatic title display
- Click to open in Obsidian

### Link Nodes
- External URL references
- Web resources and references
- Research source links

## Canvas Connection Features

### Labeled Connections
- Relationship descriptions
- Process flow indicators
- Dependency types

### Visual Organization
- Automatic positioning
- Size customization
- Color coding (via Obsidian)

## Integration Benefits

### Dataview Advantages
- **Query Power**: SQL-like queries on markdown files
- **Live Updates**: Results update as vault changes  
- **Flexible Views**: Tables, lists, tasks in one tool
- **Metadata Rich**: Leverage frontmatter properties

### Canvas Advantages
- **Visual Thinking**: Spatial organization of ideas
- **Relationship Mapping**: Clear connection visualization
- **Collaborative Planning**: Shared visual workspace
- **Multi-Format**: Text, files, links in one view

### Combined Workflow
1. **Discover**: Use Dataview to find relevant notes
2. **Organize**: Create Canvas with discovered content
3. **Connect**: Link related concepts visually
4. **Iterate**: Update queries and canvas as project evolves