import os
import asyncio
from typing import Optional
import groq
from groq import Groq

class GroqProxy:
    def __init__(self):
        """Initialize Groq client"""
        self.api_key = os.getenv("GROQ_API_KEY", "your-groq-api-key-here")
        self.client = Groq(api_key=self.api_key)
        
        # System prompt for portfolio advisor
        self.portfolio_advisor_prompt = """
        You are a knowledgeable portfolio advisor for the ASX market.
        Always use the most recent stock data and news provided below for your analysis. Ignore any outdated information you may have learned during training.
        [LIVE DATA]
        {{live_data}}
        [END LIVE DATA]
        Provide helpful insights and answer questions about:
        - Stock analysis
        - Portfolio performance
        - Investment strategies
        - Risk management
        - Portfolio diversification
        Be informative but always include appropriate risk warnings.
        """

    async def chat(self, message: str, model: Optional[str] = None, live_data: str = "") -> str:
        """Chat with AI for general trading advice"""
        try:
            prompt = f"""
            {self.portfolio_advisor_prompt.replace('{{live_data}}', live_data)}
            User Message: {message}
            Please provide helpful portfolio advice and insights based on the user's message.
            """
            response = await self._call_groq(prompt, model=model)
            return response
        except Exception as e:
            return f"Error processing chat message: {str(e)}"

    async def _call_groq(self, prompt: str, model: Optional[str] = None) -> str:
        """Make actual call to Groq API"""
        try:
            # Check if we have a valid API key (not placeholder)
            if not self.api_key or self.api_key == "your-groq-api-key-here" or "GROQ_API_KEY" in self.api_key:
                print("Using mock response - no valid Groq API key found")
                return self._get_mock_response(prompt)
            
            # Use provided model or default
            model_name = model or "llama3-70b-8192"
            completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=model_name,
                temperature=0.7,
                max_tokens=2048,
            )
            print(f"Successfully called Groq API with model: {model_name}")
            return completion.choices[0].message.content
            
        except Exception as e:
            print(f"Groq API Error: {str(e)}")
            # Fallback to mock response
            return self._get_mock_response(prompt)

    def _get_mock_response(self, prompt: str) -> str:
        """Get mock response for development"""
        if "BHP" in prompt:
            return """
            **BHP Group Limited (BHP) Portfolio Analysis**
            
            **Current Position:**
            - Current Price: $45.20
            - 52-week range: $38.50 - $48.90
            - Dividend Yield: 4.2%
            
            **Portfolio Impact:**
            - Strong dividend income potential
            - Commodity sector diversification
            - Large-cap stability
            
            **Risk Assessment:**
            - Commodity price volatility
            - Global economic conditions
            - Environmental regulations
            
            **Portfolio Recommendation:** HOLD
            BHP provides solid dividend income and sector diversification. Consider for long-term portfolio stability.
            
            ⚠️ **Risk Warning:** This is not financial advice. Always do your own research.
            """
        elif "market overview" in prompt.lower():
            return """
            **ASX Portfolio Market Overview**
            
            **Major Indices:**
            - S&P/ASX 200: +0.8% (7,450 points)
            - S&P/ASX 300: +0.7% (7,280 points)
            
            **Sector Performance:**
            - Healthcare: +2.1% (led by CSL)
            - Financials: +0.5% (banking sector stable)
            - Materials: +1.2% (mining stocks up)
            - Energy: -0.3% (oil prices down)
            
            **Portfolio Opportunities:**
            - Healthcare sector growth potential
            - Financial sector stability
            - Materials sector recovery
            
            **Risk Factors:**
            - Global inflation concerns
            - China economic slowdown
            - Geopolitical tensions
            
            **Portfolio Strategy:** Consider sector diversification
            """
        else:
            return """
            **Portfolio Investment Advice**
            
            Thank you for your question about ASX portfolio management. Here are some general insights:
            
            **Key Considerations:**
            - Always do your own research before making investment decisions
            - Consider your risk tolerance and investment time horizon
            - Diversify your portfolio across different sectors
            - Monitor market conditions and economic indicators
            - Keep track of company fundamentals and earnings reports
            
            **Portfolio Management:**
            - Rebalance your portfolio periodically
            - Don't invest more than you can afford to lose
            - Consider dollar-cost averaging for long-term investments
            - Stay informed about market news and events
            
            **Remember:** Past performance doesn't guarantee future results. The ASX market can be volatile, so always approach investing with caution.
            
            ⚠️ **Risk Warning:** This is not financial advice. Always consult with a qualified financial advisor before making investment decisions.
            """

# Test function (for development)
async def test():
    proxy = GroqProxy()
    response = await proxy.chat("What's the outlook for BHP?")
    print(response)

if __name__ == "__main__":
    asyncio.run(test())
