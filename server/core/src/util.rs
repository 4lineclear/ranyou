use std::future::Future;

use tokio::task::JoinHandle;

pub fn spawn_with<F, O, T>(t: T, f: impl FnOnce(O) -> F) -> JoinHandle<F::Output>
where
    F: Future + Send + 'static,
    F::Output: Send,
    T: CloneableSet<O>,
{
    let run = f(t.clone_set());
    tokio::spawn(async move { run.await })
}

pub trait CloneableSet<O> {
    fn clone_set(self) -> O;
}

impl<T: Clone> CloneableSet<T> for &T {
    fn clone_set(self) -> T {
        self.clone()
    }
}

impl<T1: Clone, T2: Clone> CloneableSet<(T1, T2)> for (&T1, &T2) {
    fn clone_set(self) -> (T1, T2) {
        (self.0.clone(), self.1.clone())
    }
}

impl<T1: Clone, T2: Clone, T3: Clone> CloneableSet<(T1, T2, T3)> for (&T1, &T2, &T3) {
    fn clone_set(self) -> (T1, T2, T3) {
        (self.0.clone(), self.1.clone(), self.2.clone())
    }
}
