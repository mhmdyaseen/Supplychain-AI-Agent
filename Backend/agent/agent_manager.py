from datetime import datetime
from agno.document.chunking.agentic import AgenticChunking
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.embedder.google import GeminiEmbedder
from agno.knowledge.pdf import PDFKnowledgeBase
from agno.tools.knowledge import KnowledgeTools
from agno.models.google.gemini import Gemini
from agno.vectordb.chroma import ChromaDb
from agno.tools.tavily import TavilyTools
from agno.tools.duckdb import DuckDbTools
from agno.memory.v2.memory import Memory
from agno.agent import Agent
from config import config

class AgentManager:
    _instance = None
    _agent = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AgentManager, cls).__new__(cls)
        return cls._instance
    
    def initialize_agent(self):
        if self._agent is None:
            try:
                model = Gemini(
                    id='gemini-2.0-flash',
                    api_key=config.GOOGLE_API_KEY,
                    temperature=0.2
                )
                
                embedder = GeminiEmbedder(
                    id='models/embedding-001',
                    api_key=config.GOOGLE_API_KEY
                )
                
                knowledge = PDFKnowledgeBase(
                    path=config.PDF_PATH,
                    chunking_strategy=AgenticChunking(model=model),
                    vector_db=ChromaDb(
                        collection='Supply-Chain',
                        path=config.CHROMA_DB_PATH,
                        persistent_client=True,
                        embedder=embedder
                    ),
                )
                
                try:
                    with open(config.SYSTEM_PROMPT_PATH) as f:
                        system_message_template = f.read()
                except FileNotFoundError:
                    system_message_template = "You are a helpful Supply Chain AI Agent."
                
                memory = Memory(
                    model=model,
                    db=SqliteMemoryDb(
                        table_name="memories",
                        db_file=config.MEMORIES_DB_PATH
                    )
                )
                

                tools = [
                    KnowledgeTools(knowledge=knowledge),
                    DuckDbTools(
                        db_path=config.DUCKDB_PATH,
                        read_only=True,
                        create_tables=False
                    ),
                    TavilyTools(api_key=config.TAVILY_API_KEY)
                ]
                
                self._agent = Agent(
                    name="Supply Chain Agent",
                    system_message=system_message_template,
                    add_references=True,
                    model=model,
                    tools=tools,
                    memory=memory,
                    enable_agentic_memory=True,
                    add_history_to_messages=True,
                    enable_user_memories=True,
                    markdown=True
                )
                
                print("Agent initialized successfully")
                
            except Exception as e:
                print(f"Error initializing agent: {str(e)}")
                raise e
    
    def get_agent_response(self, query: str, user) -> str:
        if self._agent is None:
            self.initialize_agent()
        
        user_data = {
            'username': user.username,
            'role': user.role,
            'geolocation': user.location or 'Unknown',
            'datetime': datetime.now().strftime('%Y-%m-%d')
        }
        
        try:
            with open(config.SYSTEM_PROMPT_PATH) as f:
                system_message_template = f.read()
            formatted_system_message = system_message_template.format(**user_data)
            self._agent.system_message = formatted_system_message
        except (FileNotFoundError, KeyError):
            pass
        
        try:
            response = self._agent.run(query.strip())
            return response.content if hasattr(response, 'content') else str(response)
        except Exception as e:
            print(f"Error getting agent response: {str(e)}")
            return f"I apologize, but I encountered an error processing your request: {str(e)}"

agent_manager = AgentManager()