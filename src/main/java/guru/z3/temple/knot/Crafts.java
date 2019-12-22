/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Phaser;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Consumer;

/**
 * This has data of command to device or of collected from device.
 */
public class Crafts
{
	final private Logger logger = LoggerFactory.getLogger(Crafts.class);

	/**
	 * This means command, tool or others
	 */
	private String name;

	/** whether this need for reply */
	private boolean repliable;

	/**
	 * Collected data has been stored in this {@link ValueMap}
	 */
	private ValueMap valueMap;

	/** Who made this crafts */
	private Craftsman craftedBy;

	/** Synchronize send & reply */
	private Phaser phaser;

	/** If someone wants to handle reply asynchronously */
	private Consumer<Crafts> asyncRepliedFunc;
	/** If someone wants to handle timeout of reply asynchronously */
	private Consumer<Crafts> asyncTimeoutFunc;
	/** */
	private long asyncTimeout;

	public Crafts()
	{
		this(null, true);
	}

	public Crafts(String name, boolean repliable)
	{
		this.name = name;
		this.repliable = repliable;

		if ( repliable )
		{
			this.phaser = new Phaser(1);
		}
	}

	public boolean waitReply(long timeout)
	{
		try
		{
			int waitingPhase = this.phaser.getPhase();
			int nextPhase = this.phaser.awaitAdvanceInterruptibly(waitingPhase, timeout, TimeUnit.MILLISECONDS);
			return nextPhase > 0;
		}
		catch(InterruptedException e) { }
		catch(TimeoutException e)
		{
			logger.warn("[Crafts] waitReply is timeout !!!");
		}

		return false;
	}

	/**
	 * By this method, notify this {@link Crafts} of replied.
	 * @param phase
	 */
	public void reply(int phase)
	{
		if ( this.phaser.getPhase() == phase ) this.phaser.arrive();
		else
		{
			logger.warn("[Crafts] Invalid phase on reply, so the reply is discarded");
		}
	}

	/**
	 * Set {@link Consumer} for handling reply or timeout.
	 *
	 * @param asyncRepliedFunc
	 * @param asyncTimeoutFunc
	 * @param asyncTimeout
	 */
	public void onReply(Consumer<Crafts> asyncRepliedFunc, Consumer<Crafts> asyncTimeoutFunc, long asyncTimeout)
	{
		this.asyncRepliedFunc = asyncRepliedFunc;
		this.asyncTimeoutFunc = asyncTimeoutFunc;
		this.asyncTimeout = asyncTimeout;
	}

	public void invokeAsyncHandlers(ExecutorService es)
	{
		if ( this.asyncRepliedFunc != null || this.asyncTimeoutFunc != null )
		{
			es.execute(() -> {
				if ( waitReply(this.asyncTimeout) )
				{
					if ( this.asyncRepliedFunc != null ) this.asyncRepliedFunc.accept(this);
				}
				else
				{
					if ( this.asyncTimeoutFunc != null ) this.asyncTimeoutFunc.accept(this);
				}
			});
		}
	}

	public int getPhase()
	{
		return this.phaser == null ? -1 : this.phaser.getPhase();
	}

	// GETTER/SETTER methods =====================
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }

	public ValueMap getValueMap() { return valueMap; }
	public void setValueMap(ValueMap valueMap) { this.valueMap = valueMap; }

	public Craftsman getCraftedBy() { return craftedBy; }
	public void setCraftedBy(Craftsman craftedBy) { this.craftedBy = craftedBy; }

	public boolean isRepliable() { return repliable; }
	public void setRepliable(boolean repliable) { this.repliable = repliable; }
}
