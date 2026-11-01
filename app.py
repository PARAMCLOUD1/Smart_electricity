"""Run with python app.py. Uses only the Python standard library."""
import csv
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

from algorithms import Area, DEMO_AREAS, allocate, merge_sort, binary_search


class LoadManager(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('Smart Electricity Load Management | DAA Mini Project')
        self.geometry('1080x720')
        self.minsize(920, 640)
        self.areas = []
        self.selected = None
        self.report_capacity = None
        self.next_id = 1
        style = ttk.Style(self)
        style.theme_use('clam')
        style.configure('Treeview', rowheight=30)
        body = ttk.Frame(self, padding=22)
        body.pack(fill='both', expand=True)
        ttk.Label(body, text='Smart Electricity Load Management',
                  font=('Segoe UI', 22, 'bold')).pack(anchor='w')
        ttk.Label(body, text='Greedy essentials • 0/1 Knapsack selection • Merge Sort ranking • Binary Search',
                  padding=(0, 5, 0, 16)).pack(anchor='w')

        form = ttk.LabelFrame(body, text='Add an area demand', padding=12)
        form.pack(fill='x')
        self.name = tk.StringVar()
        self.demand = tk.StringVar()
        self.priority = tk.StringVar(value='5')
        self.essential = tk.BooleanVar()
        for column, (label, variable, width) in enumerate([
            ('Area name', self.name, 27), ('Demand (kW)', self.demand, 14),
            ('Priority (1–10)', self.priority, 14)
        ]):
            ttk.Label(form, text=label).grid(row=0, column=column, sticky='w', padx=5)
            ttk.Entry(form, textvariable=variable, width=width).grid(row=1, column=column, padx=5)
        ttk.Checkbutton(form, text='Essential load', variable=self.essential).grid(row=1, column=3, padx=12)
        ttk.Button(form, text='Add area', command=self.add_area).grid(row=1, column=4, padx=5)

        controls = ttk.Frame(body, padding=(0, 16))
        controls.pack(fill='x')
        self.capacity = tk.StringVar(value='100')
        ttk.Label(controls, text='Capacity (kW):').pack(side='left')
        ttk.Entry(controls, textvariable=self.capacity, width=9).pack(side='left', padx=8)
        ttk.Button(controls, text='Distribute power', command=self.distribute).pack(side='left', padx=4)
        ttk.Button(controls, text='Rank by demand', command=self.rank).pack(side='left', padx=4)
        ttk.Button(controls, text='Load demo', command=self.demo).pack(side='left', padx=4)
        ttk.Button(controls, text='Remove selected', command=self.remove).pack(side='left', padx=4)
        self.capacity.trace_add('write', lambda *_: self.invalidate())

        columns = ('id', 'name', 'demand', 'priority', 'essential', 'status')
        table_frame = ttk.Frame(body)
        table_frame.pack(fill='both', expand=True)
        self.table = ttk.Treeview(table_frame, columns=columns, show='headings', selectmode='browse')
        for col, title, width in zip(columns,
                                    ['ID', 'Area', 'Demand (kW)', 'Priority', 'Essential', 'Allocation'],
                                    [55, 260, 120, 85, 100, 160]):
            self.table.heading(col, text=title)
            self.table.column(col, width=width, anchor='w' if col == 'name' else 'center')
        scroll = ttk.Scrollbar(table_frame, orient='vertical', command=self.table.yview)
        self.table.configure(yscrollcommand=scroll.set)
        self.table.pack(side='left', fill='both', expand=True)
        scroll.pack(side='right', fill='y')
        self.table.tag_configure('powered', foreground='#157347')
        self.table.tag_configure('waiting', foreground='#a44016')

        footer = ttk.Frame(body, padding=(0, 14))
        footer.pack(fill='x')
        self.search_id = tk.StringVar()
        ttk.Label(footer, text='Search area ID:').pack(side='left')
        ttk.Entry(footer, textvariable=self.search_id, width=10).pack(side='left', padx=8)
        ttk.Button(footer, text='Binary search', command=self.search).pack(side='left')
        ttk.Button(footer, text='Export report (CSV)', command=self.export).pack(side='right')
        self.summary = tk.StringVar(value='Add areas or load the demo to begin.')
        ttk.Label(body, textvariable=self.summary, font=('Segoe UI', 11), wraplength=990).pack(anchor='w')
        ttk.Label(body, text='Whole loads only. Higher priority numbers mean higher importance. '
                  'Capacity: 0–10,000 kW; up to 100 areas.', padding=(0, 10)).pack(anchor='w')

    def refresh(self, ordered=None):
        self.table.delete(*self.table.get_children())
        selected_ids = {a.id for a in self.selected or []}
        for a in self.areas if ordered is None else ordered:
            status = 'Pending' if self.selected is None else ('Powered' if a.id in selected_ids else 'Unserved')
            self.table.insert('', 'end', iid=str(a.id), values=(a.id, a.name, a.demand,
                              a.priority, 'Yes' if a.essential else 'No', status),
                              tags=('powered' if status == 'Powered' else 'waiting',))

    def invalidate(self):
        self.selected = None
        self.report_capacity = None
        self.summary.set('Inputs changed. Distribute power to generate an updated report.')
        self.refresh()

    def add_area(self):
        try:
            area = Area(self.next_id, self.name.get().strip(), int(self.demand.get()),
                        int(self.priority.get()), self.essential.get())
            allocate(self.areas + [area], 0)
        except ValueError as error:
            messagebox.showerror('Invalid demand', str(error))
            return
        self.areas.append(area)
        self.next_id += 1
        self.name.set('')
        self.demand.set('')
        self.invalidate()

    def distribute(self):
        try:
            capacity = int(self.capacity.get())
            self.selected = allocate(self.areas, capacity)
        except ValueError as error:
            messagebox.showerror('Invalid capacity', str(error))
            return
        self.report_capacity = capacity
        used = sum(a.demand for a in self.selected)
        score = sum(a.priority for a in self.selected)
        missed = sum(a.essential and a not in self.selected for a in self.areas)
        self.summary.set(f'Capacity: {capacity} kW  |  Allocated: {used} kW  |  Remaining: {capacity-used} kW\n'
                         f'Powered: {len(self.selected)}/{len(self.areas)} areas  |  Priority score: {score}'
                         f'  |  Unserved essential loads: {missed}')
        self.refresh()

    def rank(self):
        self.refresh(merge_sort(self.areas, key=lambda a: (-a.demand, a.id)))

    def demo(self):
        self.areas = list(DEMO_AREAS)
        self.next_id = 7
        self.capacity.set('100')
        self.invalidate()
        self.distribute()

    def remove(self):
        rows = self.table.selection()
        if rows:
            self.areas = [a for a in self.areas if a.id != int(rows[0])]
            self.invalidate()

    def search(self):
        try:
            area_id = int(self.search_id.get())
        except ValueError:
            messagebox.showerror('Invalid ID', 'Enter a whole-number area ID.')
            return
        ordered = merge_sort(self.areas, key=lambda a: a.id)
        area = binary_search(ordered, area_id)
        if area is None:
            messagebox.showinfo('Search result', 'No area found with that ID.')
            return
        self.table.selection_set(str(area.id))
        self.table.see(str(area.id))
        messagebox.showinfo('Area found', f'{area.name}\nDemand: {area.demand} kW\nPriority: {area.priority}\n'
                            f'Essential: {"Yes" if area.essential else "No"}')

    def export(self):
        if self.selected is None:
            messagebox.showinfo('Generate report', 'Distribute power before exporting a report.')
            return
        path = filedialog.asksaveasfilename(defaultextension='.csv',
                                          initialfile='distribution_report.csv',
                                          filetypes=[('CSV report', '*.csv')])
        if not path:
            return
        selected_ids = {a.id for a in self.selected}
        try:
            with open(path, 'w', newline='', encoding='utf-8-sig') as output:
                writer = csv.writer(output)
                writer.writerow(['Smart Electricity Load Management Report'])
                writer.writerow(['Capacity (kW)', self.report_capacity])
                writer.writerow(['Allocated (kW)', sum(a.demand for a in self.selected)])
                writer.writerow(['Remaining (kW)', self.report_capacity - sum(a.demand for a in self.selected)])
                writer.writerow(['Priority score', sum(a.priority for a in self.selected)])
                writer.writerow(['ID', 'Area', 'Demand (kW)', 'Priority', 'Essential', 'Status'])
                for a in merge_sort(self.areas, key=lambda a: a.id):
                    # Prevent spreadsheet software interpreting area names as formulas.
                    safe_name = "'" + a.name if a.name.startswith(('=', '+', '-', '@')) else a.name
                    writer.writerow([a.id, safe_name, a.demand, a.priority, a.essential,
                                     'Powered' if a.id in selected_ids else 'Unserved'])
        except OSError as error:
            messagebox.showerror('Export failed', str(error))
            return
        messagebox.showinfo('Report saved', f'Saved to {path}')


if __name__ == '__main__':
    LoadManager().mainloop()
