package guru.z3.temple.knot;

public class CraftsEvent
{
	public enum Type {
		STARTED, STOPPED, TRYCONNECT, CONNECTED, DISCONNECTED
		, SENT, RECEIVED, COLLECTED, CONTROLLED, ERROR
	}

	private Type type;
	private Object source;

	public CraftsEvent(Type type, Object source)
	{
		this.type = type;
		this.source = source;
	}

	// GETTER/SETTER methods =====================
	public Type getType() { return type; }
	public void setType(Type type) { this.type = type; }

	public Object getSource() { return source; }
	public void setSource(Object source) { this.source = source; }
}
