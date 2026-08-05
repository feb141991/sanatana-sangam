#!/bin/bash
# Update the graphify source code graph for src and packages directories, avoiding node_modules.
echo "🔄 Updating graphify knowledge graph..."
graphify update src
graphify update packages/dharma-rules
graphify update packages/panchang-engine
echo "✅ Graphify knowledge graph updated."
