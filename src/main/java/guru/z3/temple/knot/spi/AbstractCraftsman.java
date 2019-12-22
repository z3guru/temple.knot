/*
This work is licensed under the Creative Commons Attribution-NoDerivatives 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/
package guru.z3.temple.knot.spi;

import guru.z3.temple.knot.Crafts;
import guru.z3.temple.knot.Craftsman;
import guru.z3.temple.knot.Tool;
import guru.z3.temple.knot.Workshop;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.TimerTask;

/**
 * This is a implements {@link Craftsman} simply, but this has two methods for extending
 * {@link #postAssign}, {@link #preDeassign}
 */
abstract public class AbstractCraftsman implements Craftsman
{
	final private Logger logger = LoggerFactory.getLogger(AbstractCraftsman.class);

	/** Where this is assigned to {@link Workshop} */
	protected Workshop workshop;
	/** Queue of crafts */
	protected Queue<Crafts> craftsQueue;
	/** Queue of crafts */
	private List<TimerTask> timerTasks;

	abstract protected void postAssign() throws IOException;
	abstract protected void preDeassign() throws IOException;

	@Override
	final public void assign(Workshop workshop) throws IOException
	{
		this.workshop = workshop;
		this.craftsQueue = new LinkedList<>();
		this.timerTasks = new LinkedList<>();

		postAssign();
		logger.debug("[Craftsman] Assigned");
	}

	@Override
	final public Workshop assigned()
	{
		return this.workshop;
	}

	@Override
	final public void deassign() throws IOException
	{
		preDeassign();
		this.timerTasks.forEach(t -> t.cancel());
		logger.debug("[Craftsman] De-assigned");
	}

	@Override
	public void work(Crafts crafts, Tool tool) throws IOException
	{
		ValueMapTagMap tagMap = ValueMapTagMap.wrap(crafts.getValueMap());

		if ( crafts.isRepliable() )
		{
			craftsQueue.add(crafts);
			tagMap.setSerialNumber(crafts.hashCode());
			tagMap.setPhase(crafts.getPhase());

			// if there are handlers must run asynchronously in crafts
			// then run those in background threads ...
			crafts.invokeAsyncHandlers(this.workshop.getExecutorService());
		}

		tool.streaming(this, tagMap);
	}
	@Override
	public void work(final Crafts crafts, final Tool tool, long interval, int iterateCount) throws IOException
	{
		if ( iterateCount == 1 ) work(crafts, tool);
		else
		{
			ValueMapTagMap tagMap = ValueMapTagMap.wrap(crafts.getValueMap());
			if ( crafts.isRepliable() )
			{
				craftsQueue.add(crafts);
				tagMap.setSerialNumber(crafts.hashCode());
				tagMap.setPhase(crafts.getPhase());
			}

			long safelyInterval = interval < 100 ? 100 : interval;
			TimerTask task = this.workshop.schedule(() -> scheduledWork(crafts, tagMap, tool), safelyInterval, iterateCount);
			this.timerTasks.add(task);
		}
	}

	protected Crafts findCrafts(int hashCode)
	{
		return this.craftsQueue.stream().filter(c -> c.hashCode() == hashCode).findFirst().orElse(null);
	}

	private void scheduledWork(Crafts crafts, ValueMapTagMap tagMap, Tool tool)
	{
		try
		{
			tagMap.setPhase(crafts.getPhase());
			// if there are handlers must run asynchronously in crafts
			// then run those in background threads ...
			crafts.invokeAsyncHandlers(this.workshop.getExecutorService());

			tool.streaming(this, tagMap);
		}
		catch(Exception e)
		{
			logger.error(e.getMessage(), e);
		}
	}
}
